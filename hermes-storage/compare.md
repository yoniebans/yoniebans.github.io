---
title: "Hermes conversation storage: comparison with main's store"
---

# Hermes conversation storage: comparison with main's store

PR 2 of the storage stack ([#149566](https://github.com/NousResearch/hermes-agent/pull/149566)) adds a SQLite backend that runs the SQL `SessionDB` runs on main today. Two checks compared the backend with main's own store while it was built. The SQL map pairs every statement the backend executes with the statement on main it replaces. The comparison tests run one operation on the backend and on main's `SessionDB` and compare what each returns, raises and leaves in the database.

Both checks import main's store code from a second checkout, and that code is gone from the repository once the stack lands. So they left the pull request, and this page records their results against main at commit [`21ae0e1238`](https://github.com/NousResearch/hermes-agent/commit/21ae0e1238fdf466fa52a85a6ebf75d6899e49da). The [coverage table](coverage.html) names what replaces each `SessionDB` method; this page shows how closely the replacement matches.

## Results

| Check | Result |
|---|---|
| SQL map against main at `21ae0e1238` | 184 failures, all coverage bookkeeping; no mapped statement differs |
| Comparison tests with main's store (67 files, 2,716 cases) | 2,077 passed, 638 failed, 1 skipped |
| The same 67 files without main's store | 456 passed, 6 failed, 2,254 skipped |

The backend side is PR 2 at commit `c73ad51954`, which sits on main at `21ae0e1238`, with the map and the comparison tests restored on top as commit `67127fafd5`. All runs were on one Mac (macOS, Apple silicon) on 8 November 2026.

The map's manifests and the comparison tests were written against main at commit `6b21d05645`. Main then moved 851 commits on to `21ae0e1238`, and its storage code changed on the way. Among other changes, main added stored-session reads for the session picker and transcript pages, removed the CJK search tokenizer, and reworked the search index rebuild. PR 2 at `c73ad51954` carries those changes. Each failure is one of two things: a manifest entry, a test's list of names or a test's copy of main's code that predates them, or a cause on this host. None is a difference in what the backend stores or returns.

## Why these checks are not in the repository

Each check needs main's store code beside the new code. The tests read the checkout's path from `HERMES_STATE_ORACLE_TREE` and import its `hermes_state*` modules and gateway files; without it, every comparison case skips with "compares with the legacy store: set HERMES_STATE_ORACLE_TREE to a pinned main checkout". The SQL map's checker takes the same checkout as `--legacy`.

After the stack lands, main has no `SessionDB` to compare with. Running the checks then means checking out an older commit beside the tree, which the repository's CI does not do. The map's manifests and the tests' lists also name main's functions by path, member and statement position, so every storage change on main needs a hand edit to them, as the failures below show.

## The SQL map

The map is 17 JSON manifests, one per family (conversation, admissions, hosted rooms, workers and the rest), plus a checker. A manifest entry pairs a backend function with the statements on main it replaces. The checker parses both trees, extracts every SQL statement and every function that builds SQL text, and compares each pair. It compares the statement count and order, the SQL text, the bound values, the transaction each statement runs in, and the text of the builders.

Each difference either fails or is a ruled exception. A ruled exception is a difference recorded in the manifest with a reason that says how main's behaviour holds.

Against main at `21ae0e1238`, the checker read 1,669 backend statements, 158 SQL-building functions and 1,669 statements in main's modules that the manifests name. No mapped pair differs in SQL text, bound values, transaction or builder text.

### Ruled exceptions (230)

| Category | Entries | What the difference is |
|---|---|---|
| Read context | 78 | Main ran a read on a bare connection, outside any store transaction. The backend runs it in its read context with the same lock wait (5 s, 1 s or 10 s, as main's connection had). |
| Checker limit | 66 | The checker cannot see that the two sides match: it matches calls by name and counts some functions as SQL builders that return records, it compares a constant's name and not its value, or the backend passes the store's folder where main read the Hermes home from the process. |
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

### The 184 failures

Every failure is a statement, builder or entry the manifests do not account for yet:

- 113 backend statements and 4 SQL-building functions with no manifest entry;
- 42 statements on main that no manifest maps;
- 17 entries that name a function, on either side, that no longer holds the SQL the entry expects, because main moved that SQL to other functions or removed the function;
- 3 entries whose statement count differs, because main's `upsert_room_link_record`, `disband_room` and `get_messages` gained statements (4 against 3, 5 against 3, and 3 against 2);
- 2 builder entries for functions that no longer build SQL, 2 ruled exceptions with no difference left to excuse, and 1 entry that expects 3 statements in main's update notice, which now runs 2.

Each of the 113 statements and 4 builders has its counterpart on main at `21ae0e1238`:

| Backend code without a manifest entry | Statements | Main's code it follows |
|---|---|---|
| Reading a stored session without attaching to it (picker fields, transcript pages, handoffs, delegated children) | 23 | `hermes_state_stored_reads.py` |
| Owed and held grant revokes, room link retirement, dropping a remote run receipt | 22 | `gateway/hosted_rooms.py` |
| The stored-refusal repair | 16, plus 2 builders | `hermes_state_legacy_refusal.py` |
| Removing the retired CJK search index | 12 | `hermes_state_fts.py` |
| Search index rebuild steps and the storage notice | 9 | `hermes_state_search.py`, `hermes_cli/update_cmd_maint.py` |
| Reading a display set and its removed rows in one transaction | 5 | `hermes_state_messages.py`, `hermes_state_stored_reads.py` |
| The home each room member's attempt was admitted at | 5 | `gateway/session_hosted_member_homes.py` |
| Router call claims | 4 | `tui_gateway/hosted_room_router_call.py` |
| Room member homes | 4 | `gateway/session_hosted_member_homes.py` |
| A group room's continued discussion | 4 | `gateway/hosted_room_policy_checkpoint.py` |
| Keeping a refused turn for display | 3 | `hermes_state_rewind.py` |
| Retiring the canonical Bot Chat's title on archive | 3 | `hermes_state_titles.py` |
| Clearing a session's messages | 2 | `SessionDB.clear_messages` in `hermes_state_messages.py` |
| An indeterminate peer attempt | 1 | `gateway/hosted_room_driver.py` |
| `row_size_sql` and `usage_sql` | 2 builders | `gateway/hosted_room_work_storage.py` |

The 42 unmapped statements on main are mostly the other side of the same changes. Grant revokes and link retirement account for 22, the continued discussion for 4, and the disband's two new statements and the update notice for 2 each. The new display-set read in `get_messages`, dropping a remote run receipt and the indeterminate attempt account for 1 each. The other 9 are the integrity probe in `hermes_state_repair.py`'s `_db_opens_cleanly`, which the backend's doctor calls from main's module at this commit instead of running statements of its own. Without manifest entries the checker cannot compare these pairs; the comparison tests below cover the same verbs.

## The comparison tests

A comparison test builds the same state in a backend store and in main's `SessionDB` or gateway module. It runs the backend operation and main's method, then compares the return value, the raised error, and the rows each leaves in the database. Some tests compare a function the backend copies from main with main's function, text for text. The upgrade tests open stores written by older releases and compare the migrated files.

The restored files are 35 whole files and 32 files that gained comparison cases beside cases that run on their own. Together they hold 2,716 cases. Without main's checkout, 2,254 skip: 2,253 comparison cases and one Linux-only case that skips on macOS either way. One of the 2,253 is a test of PR 2's own that sits in a restored file whose setup imports main's module. The other 462 run either way.

| Family | Files | Cases | Passed | Failed | Skipped | Skipped without main |
|---|---|---|---|---|---|---|
| admin | 3 | 74 | 69 | 4 | 1 | 61 |
| authority | 14 | 736 | 736 | 0 | 0 | 570 |
| conversation | 13 | 839 | 219 | 620 | 0 | 747 |
| core | 2 | 168 | 157 | 11 | 0 | 161 |
| gateway | 2 | 32 | 32 | 0 | 0 | 30 |
| hosted rooms | 12 | 227 | 225 | 2 | 0 | 209 |
| housekeeping | 5 | 130 | 130 | 0 | 0 | 125 |
| SQL map checker | 6 | 94 | 94 | 0 | 0 | 0 |
| upgrade | 1 | 224 | 224 | 0 | 0 | 224 |
| workers | 8 | 191 | 190 | 1 | 0 | 127 |
| logger names | 1 | 1 | 1 | 0 | 0 | 0 |
| Total | 67 | 2,716 | 2,077 | 638 | 1 | 2,254 |

The SQL map checker's 94 tests run the checker on small fixture trees and need no checkout of main.

### The 638 failed cases

Each failed file was rerun alone three times, and once more with full diffs; the same 638 cases failed in every run. None of the failed tests exists in PR 2 at `c73ad51954`, and the four of these files that PR 2 has pass there (58 cases).

634 cases fail on a name, a list or a copy of main's code that the test recorded before main's later changes:

| Failed cases | What differs |
|---|---|
| `conversation/test_store_parity.py`: all 605 cases of `test_copy_matches_legacy` | The test's list of copied members still names four that main has removed: `SessionMessagesMixin._with_removed_identities`, and `_BOUNDARY_SWEEP_SQL`, `_rebuild_status` and `_has_lone_cjk_run` in search. The test builds one shared catalog of main's members, and the first missing name fails every case before any text is compared. |
| `conversation/test_store_parity.py`: `test_every_store_module_has_a_spec` and `test_module_defines_only_its_copies` for compression, messages, rewind, search and titles (6) | The test's list of copies per store module lacks the new modules `stored_reads` and `legacy_refusal` and the new functions `get_tool_rotation_root`, `clear_messages`, `_display_set`, `_REMOVED_IDENTITIES_SQL`, `retain_refused_turn_for_display`, `_plan_refused_retention`, `_retire_canonical_bot_chat_in_transaction` and `bot_chat_title_released`. Its search list still names the three removed search members. |
| `core/test_schema_parity.py`: `test_constant_equals_m1` for 4 CJK constants, `test_function_source_equals_m1` for 3 CJK functions, `test_method_source_equals_m1` for `_ensure_fts_cjk_schema` and `_quarantine_cjk_after_update_of_migration`, and `test_nothing_copied_outside_the_manifests` (10) | Main removed the CJK tokenizer and its schema code. The test still compares with those names, and its manifest still lists the two methods. |
| `conversation/test_search_storage.py`: `test_search_takes_m1s_route` for 8 queries | The test reads `SessionDB._fts_cjk_available`, which main removed with the CJK tokenizer. |
| `admin/test_maintenance_parity.py`: `test_fts_storage_notice_reads_what_the_update_notice_decides_on[cjk-marker]` (1) | The test's copy of main's update notice still treats the old CJK rebuild marker as an unfinished run. Main's notice now checks only the base rebuild marker and the trash tables, as the backend does. |
| `core/test_schema_parity.py`: `test_method_source_equals_m1[SessionSchemaMixin._init_schema]` (1) | The schema step adds an import of the stored-refusal repair from the backend's own module. The warning logged after the old CJK index is removed names the library file under the store's folder, where main names it under the Hermes home. The rest of the text is main's. |
| `hosted/test_placement.py`: `test_each_verb_creates_the_tables_its_m1_operation_creates`, profile and shared (2) | Both stores create the same tables. The test's fixed list of hosted-room tables lacks `hosted_room_owed_revokes`. |
| `workers/test_worker_verbs.py`: `test_verb_matches_m1[compression_lineage_view]` (1) | The case's projection of the backend's answer leaves out `tool_root`, which main's worker receipt and the backend's answer both carry. |

The 605 copy cases say nothing about the copies while the catalog fails. A diagnostic run outside the suite built the same catalog with the four removed names set aside and compared each copy on its own. 591 of the 605 copies are main's text exactly, and 4 are the removed names. The other 10 differ only in comments, docstrings and one wrapped signature, plus two calls written as module functions (`_display_set(holder, ...)` and `_retire_canonical_bot_chat_in_transaction(holder, ...)`) where main calls methods.

The 6 cases on the lists of copies need no checkout of main, so they are also the 6 failures of the run without main's store.

The other 4 fail because of this host:

| Failed cases | What differs |
|---|---|
| `admin/test_maintenance_parity.py`: `test_auto_maintenance_vacuums_through_the_writer_it_holds_like_the_legacy_pass`, alone and beside-a-sibling-handle (2) | One side's pass skips the VACUUM. |
| `admin/test_maintenance_parity.py`: `test_optimize_fts_storage_rewrites_a_legacy_layout_like_the_legacy_store` (1) | The backend skips the VACUUM after the rewrite (`vacuum_skipped: in_use`). |
| `conversation/test_search_storage.py`: `test_rebuild_returns_m1s_count_and_keeps_layout_3` (1) | The backend's rebuild is skipped and returns 0 where main's returns 2. |

Before a VACUUM or an index rebuild, both stores scan the other processes on the machine for open handles on the database. On macOS the scan lists each process's open files and resolves their paths. This Mac runs other agents whose processes hold files under the real Hermes home, and the test suite's guard against touching that home raises inside the scan. Both stores read a failed scan as "a foreign holder may exist" and skip the step. The logs of both files carry the warning "Could not prove state.db has no foreign holders; deferring structural maintenance: TEST BUG: file I/O against the REAL hermes home". Whether a scan fails depends on what the other processes hold at that moment, so the side that skips varies between runs. Both stores run the same scan code. On a host where no other process holds files under the Hermes home, such as a CI runner, the scan finds nothing.

## How to rerun

You need a hermes-agent clone that has commit `67127fafd5`. The commands run in the repository's test environment, which `scripts/run-in-hermes-env` provisions.

1. Put main and the restored tree side by side:

   ```bash
   git worktree add ../hermes-main 21ae0e1238fdf466fa52a85a6ebf75d6899e49da
   git worktree add ../hermes-compare 67127fafd5
   cd ../hermes-compare
   ```

2. Run the SQL map check (add `--json` for the machine-readable report):

   ```bash
   scripts/run-in-hermes-env bash -c '"$__HERMES_TEST_PYTHON" persistence/sqlite/_sqlmap/check.py check --legacy ../hermes-main --branch .'
   ```

3. List the restored test files:

   ```bash
   git diff --name-only c73ad51954 67127fafd5 -- tests | grep '/test_[^/]*\.py$' > ../compare-files.txt
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
