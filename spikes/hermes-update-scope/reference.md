# Hermes clients, installs & update logistics

A shared picture of how Hermes updates itself across **every** client and
install type — not just the desktop app. Written so the team agrees on what
exists, what each surface does, and which combinations aren't handled yet.

---

## TL;DR — the five things that matter most

1. **"Update" is two separate actions, not one.** Updating the **agent**
   (Python back end) and updating a **front end** (the desktop Electron app)
   are different operations with different triggers and different blast radii.
   In any setup where the front end and agent are on different machines, they
   update independently.

2. **Only git and pip installs can self-apply an update.** docker, nixos, and
   homebrew installs detect that they're behind but hand you off to the right
   package manager — they do not update in place.

3. **Updating the agent does not restart it.** New code lands on disk; the
   running process keeps serving the old code until it is restarted. Nothing in
   the update path auto-restarts the agent or reloads any front end.

4. **The compatibility check is one-directional.** The desktop client warns when
   the agent is *older* than it requires. It does **not** warn when the client
   is older than the agent. One of three skew states is detected.

5. **There is no front-end-only install path today.** A remote-only desktop
   client still has to bootstrap a local agent first. This blocks anyone who
   doesn't want the agent installed on their machine.

---

## 1. The four clients

Every client talks to the same Python agent. What differs is whether the client
*is* the agent's host, and whether it can trigger or only display an update.

| Client | What it is | Shows update available? | Can apply the update? |
|---|---|---|---|
| **CLI** (`hermes`) | Terminal agent + the `hermes update` command | Banner on start | Yes — `hermes update` applies (git/pip/uv-tool); docker/nix/brew print guidance |
| **TUI** (`hermes --tui`) | Ink terminal UI over the agent | Badge in the UI | No — display only; user runs `hermes update` in a shell |
| **Dashboard** (`hermes dashboard`) | Web UI served by the agent | "Check now" + button | Yes — button POSTs to the agent's update endpoint (git/pip only) |
| **Desktop** (Electron) | Packaged app wrapping a renderer + agent | Status-bar version button(s) | Agent: yes, via the same endpoint. Renderer: no — needs a new app build |

The **agent itself** is the only thing that ever actually runs an update. The
CLI command, the dashboard button, and the desktop button all converge on the
same `hermes update` logic. The TUI and a remote desktop renderer are
display-only with respect to it.

---

## 2. The two update loops

| Loop | What it updates | Triggered by | Restarts the target? |
|---|---|---|---|
| **Agent update** | Python code on disk (CLI, gateway, dashboard, bundled agent) | `hermes update` · dashboard button · desktop backend button | No — running process must be restarted to load it |
| **Front-end update** | The desktop Electron renderer | A new app build (packaged) or a source rebuild (dev) | The app restarts itself; no live reload mid-session |

The TUI, CLI, and dashboard UIs are not separately "updated" — they ship inside
the agent, so the agent update *is* their update (after a restart). Only the
desktop renderer is a distinct artifact with its own loop, because it's packaged
separately from the agent it talks to.

---

## 3. Install types — five, each with its own apply command

`detect_install_method()` returns exactly one of these. The command differs per
type; only git and pip can apply without leaving Hermes.

| Type | What it is | Update command | Self-applies? |
|---|---|---|---|
| **git** | curl/git-clone install; a real `.git` checkout | `git pull` + reinstall (via `hermes update`) | Yes |
| **pip** | PyPI install | `uv pip install --upgrade hermes-agent` (or plain `pip`) | Yes |
| **pip / uv-tool** | pip-family, installed by `uv tool install` (lives outside any venv) | `uv tool upgrade hermes-agent` | Yes |
| **homebrew** | macOS Homebrew formula | `brew upgrade hermes-agent` | No — runs brew |
| **nixos** | Nix-managed | owned by the Nix config | No — rebuild Nix |
| **docker** | published container image | `docker pull nousresearch/hermes-agent:latest` | No — pull new image |

### How the type is decided — first match wins

1. **Stamp file** `~/.hermes/.install_method`, written by the installer. Authoritative.
2. **Managed marker** → `nixos` or `homebrew`.
3. **A `.git` *directory* is present** → `git`.
4. **Nothing matched** → `pip`.

Container presence is deliberately *not* a signal on its own: an unsupported
manual install inside a container used to be misclassified as the published
image and refuse to update.

---

## 4. Client topologies — where the front end and agent sit

| Topology | Front end runs on | Agent runs on | Update loops in play | Skew possible? |
|---|---|---|---|---|
| **Local desktop** | the machine | the same machine (bundled) | Both, locked together — one app build ships both | No — they version together |
| **Agent-only (CLI/TUI/dashboard)** | none, or a terminal/web UI served by the agent | the machine | Agent loop only | No — single artifact |
| **Desktop → remote agent** | machine A | machine B | Both, **independent** | **Yes** — the core skew case |
| **Desktop → remote desktop** | machine A | machine B's bundled agent acts as gateway | Both, **independent**, both ends are full installs | **Yes** |

Skew is only possible when the desktop renderer and the agent are
independently updatable — i.e. the two remote topologies. Local desktop ships
both halves as one app; the agent-only clients have no separate renderer to drift.

---

## 5. Where things live, by OS

Every cell is the literal location — no "same as above."

| Piece | Linux | macOS | Windows |
|---|---|---|---|
| Install root (`HERMES_HOME`) | `~/.hermes` | `~/.hermes` | `%LOCALAPPDATA%\hermes` |
| Bundled agent checkout | `~/.hermes/hermes-agent` | `~/.hermes/hermes-agent` | `%LOCALAPPDATA%\hermes\hermes-agent` |
| Python venv | `~/.hermes/hermes-agent/venv` | `~/.hermes/hermes-agent/venv` | `%LOCALAPPDATA%\hermes\hermes-agent\venv` |
| Packaged desktop app | not shipped (use dev mode) | `/Applications/Hermes.app` | thin installer in Program Files |
| Desktop connection state | `~/.config/Hermes/connection.json` | `~/Library/Application Support/Hermes/connection.json` | `%APPDATA%\Hermes\connection.json` |
| Remote token store | env var / file (no OS keystore) | macOS Keychain (`security`) | Windows Credential Manager |
| Bundled Node (macOS DMG bootstrap) | n/a | `~/.local/bin/node` | bundled in installer |

The macOS packaged install is two-stage: the downloaded DMG is a small
bootstrap-installer (~7 MB) that clones the agent and builds the venv, then
launches the real ~150 MB Electron app. Setting remote env vars before the
bootstrap does nothing — there's no front-end-only path through it.

---

## 6. The "behind" signal — what each value means

The dashboard/desktop update check returns a `behind` count with specific
sentinel values. Reading them wrong leads to false "you're up to date":

| `behind` value | Meaning |
|---|---|
| `0` | Up to date |
| `>= 1` | That many commits behind upstream (git installs) |
| `-1` | Behind by an unknown amount — nix/pypi, where commit math doesn't apply |
| `null` | The check could not run — offline, no remote configured, etc. |

`can_apply` is `true` only for git and pip; `false` for docker/nix/homebrew,
which surface the count but route you to their package manager.

---

## 7. Version vs. compatibility — two different numbers

| | Displayed version | Compatibility contract |
|---|---|---|
| **What it is** | Real semver, e.g. `0.16.0` | A monotonic integer — only ever increments |
| **Meaning** | Human-facing "which release" | Machine-facing "which wire protocol" |
| **Moves when** | Every release | Only on a breaking client⇄agent protocol change |
| **Used for** | The version button label | The skew check on connect |

They're separate so a routine patch bump doesn't trigger a compatibility
warning — only a genuinely breaking contract change does.

### The skew check is one-sided

The client holds the minimum contract it was built against; the agent reports
its own. On connect the client compares them — but only in one direction.

| State | Detected? | Behaviour |
|---|---|---|
| Agent contract **<** client requires | **Yes** | Persistent "agent out of date" warning with an align action |
| Agent contract **>=** client requires | No signal | Treated as fine (client-behind is indistinguishable here) |
| Client **<** agent's contract | **No** | Slips through silently; no "client out of date" path exists |

The one warning that does fire also points the user at the *client* update flow,
which is the wrong fix if the real problem is a stale client. Detecting
client-behind, with its own message and correct remedy, is an open gap.

---

## 8. Open questions for the team

1. **One-sided skew check** — should we detect client-behind-agent, with its own
   message and the correct remedy (update the client, not the agent)?
2. **Worktree mis-detection** — a git *worktree* has a `.git` *file*, not a
   directory, so it falls through to `pip`. A pip "upgrade" against a real git
   install can silently downgrade to PyPI code. Fix: follow the worktree pointer
   file and still classify it `git`.
3. **Stale agent after update** — the agent update doesn't restart the running
   process, so it keeps serving old code until manually restarted. Surface a
   "restart required," or restart it as part of the update.
4. **No front-end-only install path** — a remote-only desktop client can't be
   installed without bootstrapping a local agent. A real gap for users who don't
   want the agent on their machine.
5. **TUI/CLI update parity** — the TUI is display-only while the CLI applies;
   worth confirming that's intentional and not a missing affordance.

---

*Status: the two-version desktop display + agent changelog described in §7 is
in-flight, not yet on `main`. Treat this as a living scope — the matrix and open
questions will move as it lands.*
