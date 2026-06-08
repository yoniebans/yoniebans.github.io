# Hermes update & topology map

Scope: understand every combination that matters for the desktop remote-update
feature — install types, deployment topologies, OS-specific locations, what each
"update" actually mutates, whether the GUI reloads itself, and where
compatibility/skew fits. Grounded in source as of this checkout
(`/mnt/hermes/source/hermes-agent`), not memory.

---

## 1. Install types — there are FIVE, not three

`detect_install_method()` (`hermes_cli/config.py:347`) returns one of:

| method     | what it is                                          |
|------------|-----------------------------------------------------|
| `docker`   | published `nousresearch/hermes-agent` image         |
| `nixos`    | Nix-managed (`HERMES_MANAGED` / `.managed` marker)   |
| `homebrew` | `brew install` managed                              |
| `git`      | curl/git-clone install (a real `.git` **directory**)|
| `pip`      | PyPI install — the fallback when nothing else hits  |

Plus one sub-variant inside `pip`: **`uv tool` install**
(`is_uv_tool_install()`, config.py:397) — lives at `.../uv/tools/hermes-agent/`,
outside any venv, so it updates via `uv tool upgrade` not `uv pip install`.

### How the type is identified (resolution order, config.py:370-384)
1. **Stamp file** `~/.hermes/.install_method` — written by the installers. The
   curl installer stamps `git`; the docker image stamps `docker` at boot.
   This wins over everything.
2. **Managed marker** — `get_managed_system()` → `nixos` / `homebrew`.
3. **`.git` is a directory** → `git`.
4. **Fallback** → `pip`.

Container detection is deliberately NOT a signal on its own (issue #34397): an
unsupported manual install in a container used to misclassify as `docker` and
refuse to update.

### Per-method update command (`recommended_update_command_for_method`, config.py:425)
- `nixos`  → guidance text (`_NIX_UPDATE_MSG`); not self-applied.
- `homebrew` → `brew upgrade hermes-agent`.
- `docker` → `docker pull nousresearch/hermes-agent:latest`.
- `pip` → `uv tool upgrade hermes-agent` (uv-tool layout) · `uv pip install 
  --upgrade hermes-agent` (uv present) · `pip install --upgrade hermes-agent`.
- `git` (anything else) → `hermes update` → `git pull origin main` + reinstall.

### THE worktree-misdetection bug (confirmed, follow-up to file)
A `git worktree`'s `.git` is a **one-line pointer FILE**, not a directory →
`(project_root / ".git").is_dir()` is False → falls through to `pip`. So a
worktree-launched dashboard reports `install=pip` and would run the PyPI-upgrade
path even though the user installed via git. Two harms: tests the wrong update
path, and a `pip --upgrade` against a git install silently DOWNGRADES to
(usually older) PyPI code. Fix: when `.git` exists as a file, read the gitdir
pointer and still classify `git`.

---

## 2. Deployment topologies — what's running where

The desktop app resolves topology in `resolveRemoteBackend()` (electron/
main.cjs); "what gets updated" depends entirely on this.

| topology | client (Electron renderer) | backend (Python agent/gateway) | notes |
|---|---|---|---|
| **Local desktop** (bundled) | packaged app's frozen renderer | auto-spawned `hermes dashboard` on same host, port 9120–9199, own venv at `~/.hermes/hermes-agent/venv` | one machine, one update loop conceptually |
| **Agent-only / CLI** | none | `hermes` CLI / `hermes dashboard` / `hermes gateway` — can BE a backend for a remote desktop. **Our Mini setup.** | no renderer to update |
| **Desktop → remote agent** (thin client) | packaged renderer or `npm run dev` on client | a separate host's dashboard, reached over Tailscale; client is Python-free | TWO independently-updatable artifacts — the core skew problem |
| **Desktop → remote desktop** | renderer on A | another desktop's bundled agent+gateway acting as the remote gateway | same skew shape as thin-client, both ends are full installs |

Resolution priority inside remote mode (corrected June 2026):
**per-profile override > `HERMES_DESKTOP_REMOTE_URL` env > persisted global
`connection.json`.** (See hermes-desktop-gui skill.)

---

## 3. OS-specific locations (the "moving pieces")

| piece | Linux | macOS | Windows |
|---|---|---|---|
| install root (`HERMES_HOME`) | `~/.hermes` | `~/.hermes` | `%LOCALAPPDATA%\hermes` |
| bundled agent clone | `~/.hermes/hermes-agent` | `~/.hermes/hermes-agent` | under `%LOCALAPPDATA%\hermes` |
| venv | `~/.hermes/hermes-agent/venv` | same | same |
| packaged desktop app | (Linux pkg non-functional) | `/Applications/Hermes.app` | thin installer |
| desktop connection state | `~/.config/...` userData | `~/Library/Application Support/Hermes/connection.json` (Keychain-backed token via safeStorage) | `%APPDATA%\Hermes\` |
| keychain/secret store | (none — env/file) | macOS Keychain (`security`) | Windows Credential store via safeStorage |
| node (bootstrap installs) | system / nvm | `~/.local/bin/node` (DMG bootstrap) | bundled |

The Mac DMG is a ~7 MB Tauri bootstrap-installer, not the real app; it clones +
builds the venv then launches the ~150 MB Electron app. There is no env-var
"lite-only" path through the packaged DMG today.

---

## 4. The update permutation matrix

Two independent "update" actions exist, each with its own per-OS / per-method
behaviour. They are NOT the same loop.

### 4a. Backend update (what our feature's Install triggers)
`applyBackendUpdate` → `POST /api/hermes/update` → `_spawn_hermes_action(
["update"], ...)` (web_server.py:1310) → spawns `python -m hermes_cli.main
update` **using the running interpreter** (i.e. the dashboard's own venv), cwd =
`PROJECT_ROOT`. Then it routes by `detect_install_method`:
- git → `git pull origin main` + reinstall editable.
- pip → `uv pip install --upgrade hermes-agent` (or uv-tool / plain pip).
- nixos/homebrew/docker → guidance / their own package manager.

Blast radius = whatever venv the dashboard launched from. This is why clicking
Install against a shared-venv :9120 clobbers the live install.

### 4b. Client update (the renderer / Electron app)
The packaged renderer is frozen inside the app. `/update` in desktop chat is
**hard-blocked** (TERMINAL_ONLY_COMMANDS) → "only available in the terminal."
The status-bar pill historically punted to the terminal too. `resolveUpdateRoot`
(main.cjs:1250) biases to a real git checkout: dev → `SOURCE_REPO_ROOT`,
packaged/CLI → `ACTIVE_HERMES_ROOT`; `HERMES_DESKTOP_HERMES_ROOT` always wins.

### The conflation (the original defect you found)
In one app, four surfaces, three behaviours:
1. `/update` in chat → blocked.
2. status-bar update control → (historically) punts to terminal.
3. command-center "Update Hermes" → silently updates the **backend**.
4. version pill → shows the **client** clone version.
No labelling tied any to client-vs-backend. Our two-button feature is the fix
for the *display+skew* half; #40018 owns auto-applying the remote backend update.

---

## 5. Hot-swap / reload semantics (the part that's easy to assume wrong)

- **Python does NOT hot-reload.** A long-lived `hermes dashboard` holds the
  classes it imported at startup. After `update` pulls new code, the running
  daemon still serves the OLD code until it is **restarted**. (This is the
  stale-daemon AttributeError trap — see skill.)
- **The in-app backend update does NOT auto-restart the backend or the
  renderer.** `_spawn_hermes_action(["update"])` runs the update and exits; it
  does not relaunch the dashboard, and nothing in the update path calls
  `app.relaunch()` or reloads `webContents`. The only `webContents.reload()` in
  main.cjs (line 4752) is a **crash-recovery** handler, unrelated to update.
  → **Answer to "does updating in-app also update the desktop frontend GUI?":
    NO.** A backend update updates the backend code on disk; the running backend
    needs a restart to serve it, and the frontend renderer is a separate
    artifact that is never touched by a backend update. In remote thin-client
    mode the client renderer can only be updated by re-pulling + rebuilding the
    client clone (dev mode) or shipping a new packaged app — not from the pill.
  This is exactly why the single-version-badge model breaks and why two buttons
  are correct.

---

## 6. Compatibility / skew layer

Separate from semver display. Two hand-bumped integer constants compared at
session connect:
- backend canonical: `DESKTOP_BACKEND_CONTRACT` in `tui_gateway`, stamped into
  session runtime info as `desktop_contract`.
- client minimum: `REQUIRED_BACKEND_CONTRACT` (`apps/desktop/src/store/
  updates.ts:72`, currently `1`).
- `reportBackendContract(info.desktop_contract)` (use-session-actions.ts:222):
  `(contract ?? 0) >= REQUIRED` → dismiss skew toast; else → persistent skew
  warning with one-click align (runs the normal update flow). `?? 0` = a
  pre-GUI backend with no contract field fails the gate.
- PR #40017 bumps both 1→2. The contract integer drives the **skew toast (push)**;
  our overlay is the **version display + manual update (pull)**. Complementary.

Monotonic integer = a counter that only increments; only the ordering carries
meaning (higher = newer wire contract), unlike semver where each segment means
something. The displayed version (0.16.0) is real semver and is independent of
the contract integer.

---

## 7. Proposed light-only desktop client (open product gap)

A remote-only Mac client with NO bundled agent is NOT possible through the
packaged DMG today — the installer always runs bootstrap first
(`HERMES_DESKTOP_REMOTE_URL` is meaningless to the bootstrap). Realistic paths
today: dev mode with env vars, install in an isolated VM, or wait for a real
remote-only install path. Worth filing if the threat model excludes installing
the agent on the host. A light client would have ONLY a client-update loop and
would rely entirely on the skew toast + remote backend display for the backend
half — which is precisely what the two-button feature + #40018 set up.

---

## 8. Open follow-ups

1. **`detect_install_method` worktree misdetection** — `.git`-as-file → pip.
   File an issue; fix = handle the pointer file. (Independent of PR #40781.)
2. **Light-only desktop client install path** — product gap; no env-var
   lite path through the DMG.
3. **In-app backend update leaves the running daemon stale** — no auto-restart;
   consider surfacing "restart required" or wiring a controlled restart after a
   successful backend update so users don't hit the stale-daemon AttributeError.
