---
title: "Hermes conversation storage: comparison with main's store"
---

# Hermes conversation storage: comparison with main's store

PR 2 of the storage stack ([#149566](https://github.com/NousResearch/hermes-agent/pull/149566)) adds a SQLite backend that runs the SQL `SessionDB` runs on main today. Two checks compared the backend with main's own store while it was built. The SQL map pairs every statement the backend executes with the statement on main it replaces. The comparison tests run one operation on the backend and on main's `SessionDB` and compare what each returns, raises and leaves in the database.

Both checks import main's store code from a second checkout, and that code is gone from the repository once the stack lands. So they left the pull request, and this page records their results against main at commit [`6b21d05645`](https://github.com/NousResearch/hermes-agent/commit/6b21d0564de0492e2ebd0d8f63fca86c03b5c892). The [coverage table](coverage.html) names what replaces each `SessionDB` method; this page shows how closely the replacement matches.

## Results

| Check | Result |
|---|---|
| SQL map against main at `6b21d05645` | 44 failures: 42 come from main's storage changes after `ed1afb082e`, 2 are manifest bookkeeping |
| SQL map against main at `ed1afb082e` | 2 failures, the same 2 bookkeeping entries |
| Comparison tests with main's store (67 files, 2,713 cases) | 2,697 passed, 15 failed, 1 skipped |
| The same 67 files without main's store | 460 passed, 0 failed, 2,253 skipped |

The backend side is PR 2 rebuilt on main at `6b21d05645` (commit `0a485905ed`), with the map and the comparison tests restored on top as commit `6d0a170c4b`. All runs were on one Mac (macOS, Apple silicon) on 7 November 2026.

PR 2's backend was written against main at commit `ed1afb082e`. The storage changes main made after it reach the backend in three later commits of the stack, which commit `0a485905ed` does not hold. Of the 15 failed cases, 11 come from those changes and pass when main at `ed1afb082e` is the comparison tree. The other 4 come from this host. None of the 15 is a difference the backend introduces on its own.

## Why these checks are not in the repository

Each check needs main's store code beside the new code. The tests read the checkout's path from `HERMES_STATE_ORACLE_TREE` and import its `hermes_state*` modules and gateway files; without it, every comparison case skips with "compares with the legacy store: set HERMES_STATE_ORACLE_TREE to a pinned main checkout". The SQL map's checker takes the same checkout as `--legacy`.

After the stack lands, main has no `SessionDB` to compare with. Running the checks then means checking out an older commit beside the tree, which the repository's CI does not do. The map's manifests also name main's functions by path and statement position, so every storage change on main needs a hand edit to them, as the 42 failures below show.

## The SQL map

The map is 17 JSON manifests, one per family (conversation, admissions, hosted rooms, workers and the rest), plus a checker. A manifest entry pairs a backend function with the statements on main it replaces. The checker parses both trees, extracts every SQL statement and every function that builds SQL text, and compares each pair. It compares the statement count and order, the SQL text, the bound values, the transaction each statement runs in, and the text of the builders.

Each difference either fails or is a ruled exception. A ruled exception is a difference recorded in the manifest with a reason that says how main's behaviour holds.

Against main at `6b21d05645`, the checker read 1,589 backend statements, 158 SQL-building functions and 1,697 statements in main's modules that the manifests name. Every backend statement has exactly one manifest entry; 156 of the 158 builders do.

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

### The 44 failures

Against main at `ed1afb082e` the checker reports only two failures. `row_size_sql` and `usage_sql` moved into the backend's `persistence/sqlite/gateway/_hosted_work.py` after the map left the tree, so no manifest names them; their syntax trees equal main's functions in `gateway/hosted_room_work_storage.py`.

The other 42 are main's storage changes after `ed1afb082e`: 29 statements on main that no manifest maps, and 13 mapped entries whose text, bound values, transaction, statement count or builder now differ.

| Change on main after `ed1afb082e` | Failures |
|---|---|
| Hosted rooms owe and hold grant revokes for room links; a disband waits for held grants | 31 |
| A deliberate archive retires the Bot Chat and frees its title; the bulk archive spares it | 6 |
| Group rooms: a continued discussion, an indeterminate peer attempt | 4 |
| The schema's first run marks the stored-refusal repair as done | 1 |

## The comparison tests

A comparison test builds the same state in a backend store and in main's `SessionDB` or gateway module. It runs the backend operation and main's method, then compares the return value, the raised error, and the rows each leaves in the database. Some tests compare a function the backend copies from main with main's function, text for text. The upgrade tests open stores written by older releases and compare the migrated files.

The restored files are 35 whole files and 32 files that gained comparison cases beside cases that run on their own. Together they hold 2,713 cases. Without main's checkout, 2,253 skip: 2,252 comparison cases and one Linux-only case that skips on macOS either way. The other 460 run either way.

| Family | Files | Cases | Passed | Failed | Skipped | Skipped without main |
|---|---|---|---|---|---|---|
| admin | 3 | 74 | 70 | 3 | 1 | 61 |
| authority | 14 | 736 | 736 | 0 | 0 | 570 |
| conversation | 13 | 839 | 834 | 5 | 0 | 747 |
| core | 2 | 168 | 167 | 1 | 0 | 161 |
| gateway | 2 | 32 | 32 | 0 | 0 | 30 |
| hosted rooms | 12 | 224 | 221 | 3 | 0 | 208 |
| housekeeping | 5 | 130 | 130 | 0 | 0 | 125 |
| SQL map checker | 6 | 94 | 94 | 0 | 0 | 0 |
| upgrade | 1 | 224 | 222 | 2 | 0 | 224 |
| workers | 8 | 191 | 190 | 1 | 0 | 127 |
| logger names | 1 | 1 | 1 | 0 | 0 | 0 |
| Total | 67 | 2,713 | 2,697 | 15 | 1 | 2,253 |

The SQL map checker's 94 tests run the checker on small fixture trees and need no checkout of main.

### The 15 failed cases

Each failed case also fails when its file runs alone. Rerun with main at `ed1afb082e` as the comparison tree, 11 of them pass:

| Failed cases | What differs, and the change on main behind it |
|---|---|
| `conversation/test_store_parity.py`: `test_copy_matches_legacy` for `sessions.set_session_archived`, `titles._resolve_title_conflict`, `titles.get_session_by_title` and `titles.resolve_session_by_title` (4) | The copied functions' text. On main a deliberate archive retires the Bot Chat and frees its title, and title conflicts read `auto_archived`. |
| `core/test_schema_parity.py`: `test_method_source_equals_m1[SessionSchemaMixin._init_schema]` (1) | The schema step's text. Main's version marks the stored-refusal repair as done. |
| `hosted/test_placement.py`: `test_each_verb_creates_the_tables_its_m1_operation_creates`, profile and shared (2), and `test_the_first_shared_open_imports_the_pre_isolation_rooms_like_m1` (1) | Main creates `hosted_room_owed_revokes` and `hosted_room_revoked_grants` for grant revokes. |
| `upgrade/test_upgrade_rollback.py`: `test_first_open_migrates_like_m1`, backend-absent and backend-jsonl_converted (2) | Main's `state_meta` has a `legacy_refusal_repair` row from the stored-refusal repair. |
| `workers/test_worker_verbs.py`: `test_verb_matches_m1[compression_lineage_view]` (1) | Main's worker receipt carries a `tool_root` field, the tool-rotation root for managed workers. |

The other 4 fail with either comparison tree, and the cause is this host:

| Failed cases | What differs |
|---|---|
| `admin/test_maintenance_parity.py`: `test_auto_maintenance_vacuums_through_the_writer_it_holds_like_the_legacy_pass`, alone and beside-a-sibling-handle (2) | Main's pass skips the VACUUM. |
| `admin/test_maintenance_parity.py`: `test_optimize_fts_storage_rewrites_a_legacy_layout_like_the_legacy_store` (1) | The backend skips the VACUUM after the rewrite (`vacuum_skipped: in_use`). |
| `conversation/test_search_storage.py`: `test_rebuild_returns_m1s_count_and_keeps_layout_3` (1) | The backend's rebuild returns 0 where main's returns 2. |

Before a VACUUM or an index rebuild, both stores scan the other processes on the machine for open handles on the database. On macOS the scan lists each process's open files and resolves their paths. This Mac runs other agents whose processes hold files under the real Hermes home, and the test suite's guard against touching that home raises inside the scan. Both stores read a failed scan as "a foreign holder may exist" and skip the step. The test log carries the warning ("Could not prove state.db has no foreign holders; deferring structural maintenance: TEST BUG: file I/O against the REAL hermes home"). Whether a scan fails depends on what the other processes hold at that moment, so the side that skips varies between runs. Both stores run the same scan code. On a host where no other process holds files under the Hermes home, such as a CI runner, the scan finds nothing.

### With main's later storage changes applied

The three stack commits that bring main's storage changes into the backend end at commit `d8f2786796`. The same files were restored on it as commit `91b5a7fd0d`. There the SQL map reports no mapped statement whose text, bound values or transaction differ. Its 91 failures are coverage bookkeeping, because the manifests were not updated for those commits:

- 56 new backend statements and 4 new builders with no manifest entry;
- the 29 statements on main still unmapped;
- 2 entries whose statement count no longer matches.

On that tree the comparison tests give 2,694 passed, 18 failed and 1 skipped. The upgrade cases pass and the 4 host failures remain. Two lock-wait cases in `conversation/test_writer_read_lock_wait.py` failed once and passed when their file ran alone. The other 12 fail on text or constants the tests recorded before those commits:

- 5 copied functions whose text now differs from main's;
- 4 checks of each store module's list of copies;
- 2 checks against a fixed list of hosted-room tables;
- 1 projection of the worker's lineage answer that leaves out `tool_root`.

## How to rerun

You need a hermes-agent clone that has commit `6d0a170c4b`. The commands run in the repository's test environment, which `scripts/run-in-hermes-env` provisions.

1. Put main and the restored tree side by side:

   ```bash
   git worktree add ../hermes-main 6b21d0564de0492e2ebd0d8f63fca86c03b5c892
   git worktree add ../hermes-compare 6d0a170c4b
   cd ../hermes-compare
   ```

2. Run the SQL map check (add `--json` for the machine-readable report):

   ```bash
   scripts/run-in-hermes-env bash -c '"$__HERMES_TEST_PYTHON" persistence/sqlite/_sqlmap/check.py check --legacy ../hermes-main --branch .'
   ```

3. List the restored test files:

   ```bash
   git diff --name-only 0a485905ed 6d0a170c4b -- tests | grep '/test_[^/]*\.py$' > ../compare-files.txt
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

To compare with another commit of main, check that commit out as `../hermes-main`. The failures against main at `ed1afb082e` above come from the same commands with `ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df` in step 1.
