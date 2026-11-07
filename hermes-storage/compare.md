---
title: "Hermes conversation storage: comparison with main's store"
---

# Hermes conversation storage: comparison with main's store

PR 2 of the storage stack ([#149566](https://github.com/NousResearch/hermes-agent/pull/149566)) adds a SQLite backend that runs the SQL `SessionDB` runs on main today. Two checks compared the backend with main's own store while it was built. The SQL map pairs every statement the backend executes with the statement on main it replaces. The comparison tests run one operation on the backend and on main's `SessionDB` and compare what each returns, raises and leaves in the database.

Both checks import main's store code from a second checkout, and that code is gone from the repository once the stack lands. So they left the pull request, and this page records their results against main at commit [`6b21d05645`](https://github.com/NousResearch/hermes-agent/commit/6b21d0564de0492e2ebd0d8f63fca86c03b5c892). The [coverage table](coverage.html) names what replaces each `SessionDB` method; this page shows how closely the replacement matches.

## Results

| Check | Result |
|---|---|
| SQL map against main at `6b21d05645` | 93 failures, all coverage bookkeeping; no mapped statement differs |
| Comparison tests with main's store (67 files, 2,714 cases) | 2,695 passed, 18 failed, 1 skipped |
| The same 67 files without main's store | 455 passed, 5 failed, 2,254 skipped |

The backend side is PR 2 at commit `c82228c257`, with the map and the comparison tests restored on top as commit `fae2950770`. All runs were on one Mac (macOS, Apple silicon) on 7 November 2026.

PR 2's backend was first written against main at commit `ed1afb082e`. Commit `c82228c257` also carries the storage changes main made between `ed1afb082e` and `6b21d05645`. The map's manifests and the comparison tests were written before those changes reached the backend. Each failure is one of three things: a manifest entry or a recorded test value that predates them, a timing case that failed once under load, or a cause on this host. None is a difference in what the backend does.

## Why these checks are not in the repository

Each check needs main's store code beside the new code. The tests read the checkout's path from `HERMES_STATE_ORACLE_TREE` and import its `hermes_state*` modules and gateway files; without it, every comparison case skips with "compares with the legacy store: set HERMES_STATE_ORACLE_TREE to a pinned main checkout". The SQL map's checker takes the same checkout as `--legacy`.

After the stack lands, main has no `SessionDB` to compare with. Running the checks then means checking out an older commit beside the tree, which the repository's CI does not do. The map's manifests also name main's functions by path and statement position, so every storage change on main needs a hand edit to them, as the 93 failures below show.

## The SQL map

The map is 17 JSON manifests, one per family (conversation, admissions, hosted rooms, workers and the rest), plus a checker. A manifest entry pairs a backend function with the statements on main it replaces. The checker parses both trees, extracts every SQL statement and every function that builds SQL text, and compares each pair. It compares the statement count and order, the SQL text, the bound values, the transaction each statement runs in, and the text of the builders.

Each difference either fails or is a ruled exception. A ruled exception is a difference recorded in the manifest with a reason that says how main's behaviour holds.

Against main at `6b21d05645`, the checker read 1,651 backend statements, 160 SQL-building functions and 1,697 statements in main's modules that the manifests name. No mapped pair differs in SQL text, bound values, transaction or builder text.

### Ruled exceptions (234)

| Category | Entries | What the difference is |
|---|---|---|
| Read context | 81 | Main ran a read on a bare connection, outside any store transaction. The backend runs it in its read context with the same lock wait (5 s, 1 s or 10 s, as main's connection had). |
| Checker limit | 67 | The checker cannot see that the two sides match: it matches calls by name and counts some functions as SQL builders that return records, it compares a constant's name and not its value, or the backend passes the store's folder where main read the Hermes home from the process. |
| Boundary translation | 52 | The operation takes typed arguments where main's caller passed a row or an object, and binds the same values in the same order. Or several of main's queries with fixed values become one statement with those values bound. |
| No caller code in a transaction | 24 | Main ran caller work inside the transaction (a process probe, a transcript read, work after the commit). The backend runs that work outside the store; where a write follows, it checks that the row has not changed since the read. |
| Stated difference | 5 | Behaviour that differs on purpose, described below. |
| Fewer callers | 4 | The backend function has fewer callers than main's, so it carries fewer transaction labels; the other callers use their own copy. |
| Schema step | 1 | The hosted-room replica tables are created in the file's schema step, not in a transaction of their own before the read. |

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

### The 93 failures

Every failure is a statement or builder the manifests do not pair yet:

- 58 backend statements and 4 SQL-building functions with no manifest entry;
- 29 statements on main that no manifest maps;
- 2 entries whose statement count differs, because main's `upsert_room_link_record` and `disband_room` gained statements (4 against 3, and 5 against 3).

Each of the 58 statements and 4 builders has its counterpart on main at `6b21d05645`:

| Backend code without a manifest entry | Statements | Main's code it follows |
|---|---|---|
| Owed and held grant revokes, room link retirement, dropping a remote run receipt | 22 | `gateway/hosted_rooms.py` |
| The stored-refusal repair | 16, plus 2 builders | `hermes_state_legacy_refusal.py` |
| Router call claims | 4 | `tui_gateway/hosted_room_router_call.py` |
| Room member homes | 4 | `gateway/session_hosted_member_homes.py` |
| Keeping a refused turn for display | 3 | `hermes_state_rewind.py` |
| Retiring the canonical Bot Chat's title on archive | 3 | `hermes_state_titles.py` |
| A group room's continued discussion | 3 | `gateway/hosted_room_policy_checkpoint.py` |
| Clearing a session's messages | 2 | `SessionDB.clear_messages` in `hermes_state_messages.py` |
| An indeterminate peer attempt | 1 | `gateway/hosted_room_driver.py` |
| `row_size_sql` and `usage_sql` | 2 builders | `gateway/hosted_room_work_storage.py` |

The 29 unmapped statements on main are the other side of the same changes: grant revokes and link retirement (22), the continued discussion (3), the disband's two new statements (2), dropping a remote run receipt (1) and the indeterminate attempt (1). Without manifest entries the checker cannot compare these pairs; the comparison tests below cover the same verbs.

## The comparison tests

A comparison test builds the same state in a backend store and in main's `SessionDB` or gateway module. It runs the backend operation and main's method, then compares the return value, the raised error, and the rows each leaves in the database. Some tests compare a function the backend copies from main with main's function, text for text. The upgrade tests open stores written by older releases and compare the migrated files.

The restored files are 35 whole files and 32 files that gained comparison cases beside cases that run on their own. Together they hold 2,714 cases. Without main's checkout, 2,254 skip: 2,253 comparison cases and one Linux-only case that skips on macOS either way. One of the 2,253 is a test of PR 2's own that sits in a restored file whose setup imports main's module. The other 460 run either way.

| Family | Files | Cases | Passed | Failed | Skipped | Skipped without main |
|---|---|---|---|---|---|---|
| admin | 3 | 74 | 70 | 3 | 1 | 61 |
| authority | 14 | 736 | 736 | 0 | 0 | 570 |
| conversation | 13 | 839 | 828 | 11 | 0 | 747 |
| core | 2 | 168 | 167 | 1 | 0 | 161 |
| gateway | 2 | 32 | 32 | 0 | 0 | 30 |
| hosted rooms | 12 | 225 | 223 | 2 | 0 | 209 |
| housekeeping | 5 | 130 | 130 | 0 | 0 | 125 |
| SQL map checker | 6 | 94 | 94 | 0 | 0 | 0 |
| upgrade | 1 | 224 | 224 | 0 | 0 | 224 |
| workers | 8 | 191 | 190 | 1 | 0 | 127 |
| logger names | 1 | 1 | 1 | 0 | 0 | 0 |
| Total | 67 | 2,714 | 2,695 | 18 | 1 | 2,254 |

The SQL map checker's 94 tests run the checker on small fixture trees and need no checkout of main.

### The 18 failed cases

Each failed file was rerun alone, and 17 cases failed again. The lock-wait case `conversation/test_writer_read_lock_wait.py::test_insights_on_a_writer_store_wait_one_second_as_main` passed: it times a one-second wait and failed once while the full set ran beside other jobs.

13 cases fail on a value the test recorded before the backend took main's later changes:

| Failed cases | What differs |
|---|---|
| `conversation/test_store_parity.py`: `test_copy_matches_legacy` for `sessions.set_session_archived`, `titles._resolve_title_conflict`, `titles.get_session_by_title` and `titles.resolve_session_by_title` (4) | Comments and docstrings in the copied functions are reworded. One call is written as `_retire_canonical_bot_chat_in_transaction(holder, conn, session_id)`, a module function in the backend where main calls a method. The statements and their order are main's. |
| `core/test_schema_parity.py`: `test_method_source_equals_m1[SessionSchemaMixin._init_schema]` (1) | The schema step adds an import of the stored-refusal repair from the backend's own module; the rest of the text is main's. |
| `conversation/test_store_parity.py`: `test_every_store_module_has_a_spec` and `test_module_defines_only_its_copies` for compression, messages, rewind and titles (5) | The test's list of copies per store module lacks the new module `legacy_refusal` and the new functions `get_tool_rotation_root`, `clear_messages`, `retain_refused_turn_for_display`, `_plan_refused_retention`, `_retire_canonical_bot_chat_in_transaction` and `bot_chat_title_released`. |
| `hosted/test_placement.py`: `test_each_verb_creates_the_tables_its_m1_operation_creates`, profile and shared (2) | Both stores create the same tables. The test's fixed list of hosted-room tables lacks `hosted_room_owed_revokes`. |
| `workers/test_worker_verbs.py`: `test_verb_matches_m1[compression_lineage_view]` (1) | The case's projection of the backend's answer leaves out `tool_root`, which main's worker receipt and the backend's answer both carry. |

The 5 cases on the lists of copies need no checkout of main, so they are also the 5 failures of the run without main's store.

The other 4 fail because of this host:

| Failed cases | What differs |
|---|---|
| `admin/test_maintenance_parity.py`: `test_auto_maintenance_vacuums_through_the_writer_it_holds_like_the_legacy_pass`, alone and beside-a-sibling-handle (2) | One side's pass skips the VACUUM. |
| `admin/test_maintenance_parity.py`: `test_optimize_fts_storage_rewrites_a_legacy_layout_like_the_legacy_store` (1) | The backend skips the VACUUM after the rewrite (`vacuum_skipped: in_use`). |
| `conversation/test_search_storage.py`: `test_rebuild_returns_m1s_count_and_keeps_layout_3` (1) | The backend's rebuild is skipped and returns 0 where main's returns 2. |

Before a VACUUM or an index rebuild, both stores scan the other processes on the machine for open handles on the database. On macOS the scan lists each process's open files and resolves their paths. This Mac runs other agents whose processes hold files under the real Hermes home, and the test suite's guard against touching that home raises inside the scan. Both stores read a failed scan as "a foreign holder may exist" and skip the step. The logs of both files carry the warning "Could not prove state.db has no foreign holders; deferring structural maintenance: TEST BUG: file I/O against the REAL hermes home". Whether a scan fails depends on what the other processes hold at that moment, so the side that skips varies between runs. Both stores run the same scan code. On a host where no other process holds files under the Hermes home, such as a CI runner, the scan finds nothing.

## How to rerun

You need a hermes-agent clone that has commit `fae2950770`. The commands run in the repository's test environment, which `scripts/run-in-hermes-env` provisions.

1. Put main and the restored tree side by side:

   ```bash
   git worktree add ../hermes-main 6b21d0564de0492e2ebd0d8f63fca86c03b5c892
   git worktree add ../hermes-compare fae2950770
   cd ../hermes-compare
   ```

2. Run the SQL map check (add `--json` for the machine-readable report):

   ```bash
   scripts/run-in-hermes-env bash -c '"$__HERMES_TEST_PYTHON" persistence/sqlite/_sqlmap/check.py check --legacy ../hermes-main --branch .'
   ```

3. List the restored test files:

   ```bash
   git diff --name-only c82228c257 fae2950770 -- tests | grep '/test_[^/]*\.py$' > ../compare-files.txt
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
