---
title: "Hermes conversation storage: comparison with main's store"
---

# Hermes conversation storage: comparison with main's store

PR 2 of the storage stack ([#149566](https://github.com/NousResearch/hermes-agent/pull/149566)) adds a SQLite backend that runs the SQL `SessionDB` runs on main today. Two checks compared the backend with main's own store while it was built. The SQL map pairs every statement the backend executes with the statement on main it replaces. The comparison tests run one operation on the backend and on main's `SessionDB` and compare what each returns, raises and leaves in the database.

Both checks import main's store code from a second checkout, and that code is gone from the repository once the stack lands. So they left the pull request, and this page records their results against main at commit [`5691c9fa47`](https://github.com/NousResearch/hermes-agent/commit/5691c9fa47b16a546a5fa418a9e76fddcfbf2701). The [coverage table](coverage.html) names what replaces each `SessionDB` method; this page shows how closely the replacement matches.

## Results

| Check | Result |
|---|---|
| SQL map against main at `5691c9fa47` | 35 failures: 16 mapped statements differ and 1 statement on main has no backend counterpart; the other 18 are coverage bookkeeping |
| Comparison tests with main's store (67 files, 2,769 cases) | 2,722 passed, 46 failed, 1 skipped |
| The same 67 files without main's store | 463 passed, 3 failed, 2,303 skipped |

The backend side is PR 2 at commit `21b1cac614`, which sits on main at `5691c9fa47`. On top of it, commit `72c48bf139` restores the map and the comparison tests, and commit `1f69d84800` brings their names up to date with main (below). All runs were on one Mac (macOS, Apple silicon) on 9 November 2026.

The map's manifests and the comparison tests were written against earlier commits of main, the last of them `6b21d05645`, and main's storage code has changed since. Among other changes, main added stored-session reads for the session picker and transcript pages, removed the CJK search tokenizer, reworked the search index rebuild, added a repair for chats a stored safety refusal still locks, and moved schema version 33 in with a backfill of delegated subagent markers. PR 2 at `21b1cac614` carries those changes.

Commit `1f69d84800` updates the tests' lists of names, their copies of main's code and the manifests' entries wherever main removed, moved or added the code they name. Each change follows a commit on main, listed below. No ruled exception changed. The four behaviour tests that changed (the placement tables, the lineage view's projection, the search routes and the notice cases) changed because main changed what they compare. What fails now is a real difference between the backend's text and main's, a gap in the lists that predates main's changes, or a cause on this host.

Of the 46 failed cases, 42 compare text: a copied function's source with main's, or a module's definitions with the test's list. The other 4 compare behaviour and fail because of this host. Every other case that compares what an operation returns, raises or leaves in the database passes.

## Why these checks are not in the repository

Each check needs main's store code beside the new code. The tests read the checkout's path from `HERMES_STATE_ORACLE_TREE` and import its `hermes_state*` modules and gateway files; without it, every comparison case skips with "compares with the legacy store: set HERMES_STATE_ORACLE_TREE to a pinned main checkout". The SQL map's checker takes the same checkout as `--legacy`.

After the stack lands, main has no `SessionDB` to compare with. Running the checks then means checking out an older commit beside the tree, which the repository's CI does not do. The map's manifests and the tests' lists also name main's functions by path, member and statement position, so every storage change on main needs a hand edit to them, as the changes below show.

## Names brought up to date

| Test or manifest | Change | Main commit |
|---|---|---|
| Copy lists, messages | `_with_removed_identities`, `_display_set` and `_REMOVED_IDENTITIES_SQL` copied from `hermes_state_stored_reads.py`, where main moved them | `a7ce202aea`, `857464b871` |
| Copy lists, search | `_BOUNDARY_SWEEP_SQL` and `_has_lone_cjk_run` removed; `_rebuild_status` removed | `0a0dab0686`; `ac61edf748` |
| Copy lists, compression | `get_tool_rotation_root` added | `b1dc496790` |
| Copy lists, rewind | `retain_refused_turn_for_display` and `_plan_refused_retention` added | `6ec9d85795`, `33ef50d31f` |
| Copy lists, titles | `bot_chat_title_released` and `_retire_canonical_bot_chat_in_transaction` added | `81e944d923`, `68dd869df9` |
| Copy lists, sessions | `delegate_descendant_ids` copied from `hermes_state_delegate_children.py` | `f483ce2667` |
| Copy lists, new modules | lists for the backend's `stored_reads` and `legacy_refusal` modules | `857464b871`, `f126d33384` |
| Schema copies | schema version 33 | `f483ce2667` |
| Schema copies | the CJK tokenizer's 4 constants, 3 functions and 2 methods removed | `0a0dab0686` |
| Schema copies | the retired-index constants and functions added; `_MERGE_DISPLAY_META` added | `ac61edf748`, `bdcb60c240`, `0a0dab0686`; `16f70a2b33` |
| Search routes | the CJK bigram route removed | `0a0dab0686` |
| Storage notice | the test's copy of main's update notice no longer reads the CJK rebuild markers, and its CJK marker case is removed | `0a0dab0686` |
| Hosted-room placement | the rooms step's tables include `hosted_room_owed_revokes` | `8eb5ea845a` |
| Worker verbs | the lineage view's projection carries `tool_root` | `490e6bd996` |
| SQL map manifests | entries for main's stored reads, the retired CJK index, the rebuild steps and notice, the display set, delegated children, the refusal repair, refused-turn retention, the Bot Chat retirement, grant revokes and link retirement, member and attempt homes, router calls, indeterminate attempts and continued discussions | `857464b871`, `0a0dab0686`, `ac61edf748`, `a7ce202aea`, `f483ce2667`, `f126d33384`, `33ef50d31f`, `68dd869df9`, `8eb5ea845a`, `ada04cbd6a`, `11d7bfe7f2`, `ade44d2df9`, `57c6a9e44b` and others |

## The SQL map

The map is 17 JSON manifests, one per family (conversation, admissions, hosted rooms, workers and the rest), plus a checker. A manifest entry pairs a backend function with the statements on main it replaces. The checker parses both trees, extracts every SQL statement and every function that builds SQL text, and compares each pair. It compares the statement count and order, the SQL text, the bound values, the transaction each statement runs in, and the text of the builders.

Each difference either fails or is a ruled exception. A ruled exception is a difference recorded in the manifest with a reason that says how main's behaviour holds.

Against main at `5691c9fa47`, the checker read 1,671 backend statements, 158 SQL-building functions and 1,754 statements in main's modules that the manifests name. 16 mapped pairs differ; they are listed under the failures below.

### Ruled exceptions (231)

| Category | Entries | What the difference is |
|---|---|---|
| Read context | 78 | Main ran a read on a bare connection, outside any store transaction. The backend runs it in its read context with the same lock wait (5 s, 1 s or 10 s, as main's connection had). |
| Checker limit | 66 | The checker cannot see that the two sides match: it matches calls by name and counts some functions as SQL builders that return records, it compares a constant's name and not its value, or the backend passes the store's folder where main read the Hermes home from the process. |
| Boundary translation | 53 | The operation takes typed arguments where main's caller passed a row or an object, and binds the same values in the same order. Or several of main's queries with fixed values become one statement with those values bound. |
| No caller code in a transaction | 24 | Main ran caller work inside the transaction (a process probe, a transcript read, work after the commit). The backend runs that work outside the store; where a write follows, it checks that the row has not changed since the read. |
| Stated difference | 5 | Behaviour that differs on purpose, described below. |
| Fewer callers | 4 | The backend function has fewer callers than main's, so it carries fewer transaction labels; the other callers use their own copy. |
| Schema step | 1 | The hosted-room replica tables are created in the file's schema step, not in a transaction of their own before the read. |

The boundary translation count is one more than before because main's `upsert_room_link_record` gained a statement, and the entry's existing exception covers it as it covers the other three.

The stated differences:

- Returning a claim (4 statements). Main checked the admission gate inside the claim's write. The backend decides the gate just before the write; when a drain starts in between, the claim commits and is then undone. The ledger ends as main's refused claim leaves it, after a short window in which the claim reads as started.
- Finding a chat's first generation (1 statement). Main ran its callers' checks inside one read. The backend takes the caller's identity as an argument. The Bot Chat caller walks on with one read per skipped generation; the other callers run main's check as one extra read-only statement.

### Statements left with their callers (44)

The manifests list 44 statements on main that the backend does not take over, each with its reason:

| Reason | Statements |
|---|---|
| Served by another entry's statement (several fixed-value queries merged into one, a shared read helper, a read another family serves) | 13 |
| No production caller or sender on main | 11 |
| Text built by a rule module outside the files the checker reads (main's function copied unchanged) | 7 |
| Transaction or connection setup the backend's file holder does | 6 |
| Argument checks that stay in the caller | 4 |
| Another database than `state.db` (the API response store, the kanban board) | 3 |

### The 35 failures

16 mapped pairs differ, 14 of them in hosted-room code the manifests did not list before this update:

| Backend statements | Count | What differs |
|---|---|---|
| `owes_room_grant_revokes`, `due_room_grant_revokes` (2), `room_has_peer_obligations` | 4 | Transaction: main's read runs outside any transaction the checker knows; the backend's runs in its read context. This is the pattern of the 78 read-context exceptions, with no exception recorded for these. |
| `claim_router_call`, `release_router_call` (2 statements each) | 4 | Transaction: main creates the claims table on its connection before it begins the transaction; the backend creates it inside its immediate write (2). Main's claim and release run in an immediate transaction too, through `hermes_cli.sqlite_util.transaction`, which the checker reads as a plain write (2). |
| `claim_router_call`, `release_router_call` | 2 | Bound values: main binds the claim's key and owner from its own object and computes the expiry from its clock; the backend binds the room, event and owner it is passed, and the expiry its caller computes. |
| `hold_room_grant_revoke` | 1 | Transaction: for one of its callers the statement runs in a read where main's runs in a deferred write; for the others it runs in the same immediate write as main's. |
| `room_has_peer_obligations`, `record_attempt_home`, `attempt_home` | 3 | Bound values: the same value computed outside the call (the timestamp main computes with `_now(now)`; `home` where main binds `str(home)`; the attempt key built inline where main names it `key`). |
| `legacy_refusal._compaction_holds_refusal`, second statement | 1 | Text: the backend calls `_continued_parent_sql()` where main reads `_CONTINUED_PARENT_SQL`, the constant built from it. |
| `stored_reads.transcript_cursor_state` | 1 | Builder: with an empty lineage list the backend reads the session alone; main reads the delegated child's lineage (`transcript_lineage_ids`). |

1 statement on main has no backend counterpart: `gateway/session_hosted_member_homes.py`'s `forget_room_member_homes_locked` checks that `state_meta` exists before it deletes a room's member homes.

The other 18 are coverage bookkeeping:

- 12 are the integrity probe in `hermes_state_repair.py`'s `_db_opens_cleanly`: its 9 statements on main are unmapped, the entry for the backend's `_db_opens_cleanly` finds no SQL there, and 2 builder entries name functions that fed only that probe. The backend's doctor calls main's function from main's module at this commit instead of running statements of its own.
- 4 are code the backend copies from main that no entry lists: the 2 statements of `clear_messages`, and the `row_size_sql` and `usage_sql` builders in the backend's hosted work module. Main's code has not changed since the manifests were written, so the update left these as they were.
- 2 are ruled exceptions with no difference left to excuse (`_open_writer_conn`, `_read_ctx_with_timeout`).

## The comparison tests

A comparison test builds the same state in a backend store and in main's `SessionDB` or gateway module. It runs the backend operation and main's method, then compares the return value, the raised error, and the rows each leaves in the database. Some tests compare a function the backend copies from main with main's function, text for text. The upgrade tests open stores written by older releases and compare the migrated files.

The restored files are 35 whole files and 32 files that gained comparison cases beside cases that run on their own. Together they hold 2,769 cases. Without main's checkout, 2,303 skip: 2,302 comparison cases and one Linux-only case that skips on macOS either way. One of the 2,302 is a test of PR 2's own that sits in a restored file whose setup imports main's module. The other 466 run either way.

| Family | Files | Cases | Passed | Failed | Skipped | Skipped without main |
|---|---|---|---|---|---|---|
| admin | 3 | 73 | 69 | 3 | 1 | 60 |
| authority | 14 | 736 | 736 | 0 | 0 | 570 |
| conversation | 13 | 896 | 854 | 42 | 0 | 800 |
| core | 2 | 165 | 164 | 1 | 0 | 158 |
| gateway | 2 | 32 | 32 | 0 | 0 | 30 |
| hosted rooms | 12 | 227 | 227 | 0 | 0 | 209 |
| housekeeping | 5 | 130 | 130 | 0 | 0 | 125 |
| SQL map checker | 6 | 94 | 94 | 0 | 0 | 0 |
| upgrade | 1 | 224 | 224 | 0 | 0 | 224 |
| workers | 8 | 191 | 191 | 0 | 0 | 127 |
| logger names | 1 | 1 | 1 | 0 | 0 | 0 |
| Total | 67 | 2,769 | 2,722 | 46 | 1 | 2,303 |

The SQL map checker's 94 tests run the checker on small fixture trees and need no checkout of main.

### The 46 failed cases

Each failed file was rerun alone three times, and once more with full diffs; the same 46 cases failed in every run. None of the failed tests exists in PR 2 at `21b1cac614`, and the two of these files that PR 2 has pass there (4 cases).

38 cases of `conversation/test_store_parity.py::test_copy_matches_legacy` find a copied definition whose text is not main's. The other 620 copies are main's text exactly. Grouped by what differs:

| What differs | Copies | Which |
|---|---|---|
| Only comments, quotes or line wrapping | 3 | `stored_reads._transcript_cursor_slot`; `titles._resolve_title_conflict`, `resolve_session_by_title` |
| Docstrings or comments; the code is main's | 16 | six in messages (`get_messages`, `_display_set`, `_with_removed_identities` and three helpers), three stored reads, two each in titles and sessions, one each in search, compression and rewind. Most drop main's "Storage interface: port as ..." lines, issue numbers or caller names, or rewrite the docstring. |
| Docstrings, and the imports main makes inside the function sit at the top of the backend's module | 8 | five stored reads, `legacy_refusal._discover_sql`, `rewind.retain_refused_turn_for_display`, `titles._retire_canonical_bot_chat_in_transaction` |
| Code | 11 | See below. |

The 11 code differences:

- The refusal repair (7) and `sessions.delegate_descendant_ids` (1). Main's functions take the store as their first argument, `db`. The backend's take it as `holder`, or drop it in the three helpers that use it only to reach the static decoders `_decode_content` and `_decode_display_metadata`. `_compaction_holds_refusal` also builds the parent query once per call instead of reading main's constant (the SQL map's text difference above). `advance_legacy_refusal_repair` keeps main's lint waiver on its `except` line, but the test drops waiver comments from the backend's side before it compares, so that line differs too.
- `stored_reads.transcript_segment_page` moves its one-read transaction into a helper, `_in_one_read`.
- `stored_reads.picker_session_facts` picks each segment's last reply in the store and returns its text. Main's store returns the newest candidate rows, and main's caller (`_last_reply` in `gateway/session_picker_fields.py`) picks the reply.
- `stored_reads.transcript_cursor_state` requires the lineage list and falls back to the session alone (the SQL map's builder difference above).
- `stored_reads.transcript_handoff_rows` renames a local variable that main calls `holder`, the backend's name for the store argument.

The remaining 8 failed cases:

| Failed cases | What differs |
|---|---|
| `conversation/test_store_parity.py`: `test_module_defines_only_its_copies[messages]` (1) | The backend copies main's `clear_messages`, which the list of copies never named. Main's method predates the tests, so the update left the list as it was. |
| `conversation/test_store_parity.py`: `test_module_defines_only_its_copies[stored_reads]` (1) | The backend's module defines four functions with no counterpart in main's: `_in_one_read`, `display_generations`, `segment_page_messages` and `_last_reply`. |
| `conversation/test_store_parity.py`: `test_every_waiver_sits_in_a_listed_copy[legacy_refusal]` (1) | `advance_legacy_refusal_repair` carries a waiver comment that the test's table of waived lines does not list. |
| `core/test_schema_parity.py`: `test_method_source_equals_m1[SessionSchemaMixin._init_schema]` (1) | The schema step adds an import of the stored-refusal repair from the backend's own module. The warning logged after the old CJK index is removed names the library file under the store's folder, where main names it under the Hermes home. The rest of the text is main's. |
| `admin/test_maintenance_parity.py` and `conversation/test_search_storage.py` (4) | This host; see below. |

The first three need no checkout of main, so they are also the 3 failures of the run without main's store.

The other 4 fail because of this host:

| Failed cases | What differs |
|---|---|
| `admin/test_maintenance_parity.py`: `test_auto_maintenance_vacuums_through_the_writer_it_holds_like_the_legacy_pass`, alone and beside-a-sibling-handle (2) | One side's pass skips the VACUUM. |
| `admin/test_maintenance_parity.py`: `test_optimize_fts_storage_rewrites_a_legacy_layout_like_the_legacy_store` (1) | The backend skips the VACUUM after the rewrite (`vacuum_skipped: in_use`). |
| `conversation/test_search_storage.py`: `test_rebuild_returns_m1s_count_and_keeps_layout_3` (1) | The backend's rebuild is skipped and returns 0 where main's returns 2. |

Before a VACUUM or an index rebuild, both stores scan the other processes on the machine for open handles on the database. On macOS the scan lists each process's open files and resolves their paths. This Mac runs other agents whose processes hold files under the real Hermes home, and the test suite's guard against touching that home raises inside the scan. Both stores read a failed scan as "a foreign holder may exist" and skip the step. The logs of both files carry the warning "Could not prove state.db has no foreign holders; deferring structural maintenance: TEST BUG: file I/O against the REAL hermes home". Whether a scan fails depends on what the other processes hold at that moment, so the side that skips varies between runs. Both stores run the same scan code. On a host where no other process holds files under the Hermes home, such as a CI runner, the scan finds nothing.

## How to rerun

You need a hermes-agent clone that has the branch `wip/028/storage-compare` at commit `1f69d84800`. The commands run in the repository's test environment, which `scripts/run-in-hermes-env` provisions.

1. Put main and the restored tree side by side:

   ```bash
   git worktree add ../hermes-main 5691c9fa47b16a546a5fa418a9e76fddcfbf2701
   git worktree add ../hermes-compare 1f69d84800
   cd ../hermes-compare
   ```

2. Run the SQL map check (add `--json` for the machine-readable report):

   ```bash
   scripts/run-in-hermes-env bash -c '"$__HERMES_TEST_PYTHON" persistence/sqlite/_sqlmap/check.py check --legacy ../hermes-main --branch .'
   ```

3. List the restored test files:

   ```bash
   git diff --name-only 21b1cac614 1f69d84800 -- tests | grep '/test_[^/]*\.py$' > ../compare-files.txt
   ```

4. Run them with main's store. `scripts/run_tests.sh` does not forward `HERMES_STATE_ORACLE_TREE`, so call the per-file runner it wraps, with the same clean environment and an absolute path:

   ```bash
   scripts/run-in-hermes-env bash -c '
     env -i PATH="$PATH" HOME="$HOME" TZ=UTC LANG=C.UTF-8 LC_ALL=C.UTF-8 \
       PYTHONHASHSEED=0 PYTHONUTF8=1 \
       HERMES_STATE_ORACLE_TREE="$(cd ../hermes-main && pwd)" \
       "$__HERMES_TEST_PYTHON" scripts/run_tests_parallel.py --file-retries 0 \
       $(cat ../compare-files.txt)'
   ```

5. Run them without main's store, where every comparison case skips:

   ```bash
   scripts/run_tests.sh $(cat ../compare-files.txt)
   ```

To compare with another commit of main, check that commit out as `../hermes-main` in step 1.
