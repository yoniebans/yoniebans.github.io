This table maps every public method of `SessionDB` on main (commit `ed1afb082e`, 250 methods including those it takes from its mixins), every place outside `SessionDB` where production code runs its own SQL on the store's connection (113 call sites), and every place that opens the store's own database files directly (38 call sites) to the repository operation that replaces it in this pull request: 376 rows map to operations, 3 static helpers become plain functions beside the interface, and 22 rows are not carried, each with its reason.

Operations are written `Repository.operation`; every name exists in this pull request's `persistence/` package. Call sites link to main. A method that runs a sequence of operations today (a throttled maintenance pass, an adoption across two profiles) lists the operations the sequence calls, and the note says where the sequence runs.

## `SessionDB` methods

### Sessions (66)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`archive_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1969) | `SessionMaintenance.list_prune_candidates`, `SessionRepository.set_archived` | a caller-side helper runs the loop over these operations |
| [`assert_export_safe`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1487) | `SessionMaintenance.assert_export_safe` |  |
| [`assert_exports_safe`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1508) | `SessionMaintenance.assert_export_safe` | the batch form becomes one call per id in the caller |
| [`backfill_acp_session_cwd`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L907) | `SessionRepository.backfill_acp_session_cwds` |  |
| [`backfill_null_session_profiles`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L888) | `SessionRepository.backfill_session_owners` |  |
| [`backfill_repo_roots`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L621) | `SessionRepository.backfill_repo_roots` |  |
| [`clear_session_activity_labels`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L658) | `SessionRepository.clear_activity_labels` |  |
| [`count_empty_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1934) | `SessionRepository.count_empty` |  |
| [`count_sessions_with_stored_prompt`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prompt_refresh.py#L49) | `SessionRepository.count_with_stored_prompt` |  |
| [`create_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L416) | `SessionRepository.create` |  |
| [`declared_scope_identity`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1615) | `SessionRepository.declared_scope_identity` |  |
| [`delete_empty_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1938) | `SessionRepository.delete_empty` |  |
| [`delete_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1702) | `SessionRepository.delete` |  |
| [`delete_session_if_empty`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1791) | `SessionRepository.delete_if_empty` |  |
| [`delete_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1835) | `SessionRepository.delete_many` |  |
| [`discard_unadmitted_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1773) | `SessionRepository.discard_unadmitted` |  |
| [`end_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L477) | `SessionRepository.end` |  |
| [`ensure_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L421) | not carried | no production caller on main (the `ensure_session` calls in `agent/relay_runtime.py` are that class's own method); used by tests only |
| [`find_session_by_origin`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L437) | `RoutingRepository.session_for_origin` |  |
| [`get_next_title_in_lineage`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L222) | `SessionRepository.next_title_in_lineage` |  |
| [`get_recent_session_model_route`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L855) | `UsageRepository.recent_route` |  |
| [`get_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L834) | `SessionRepository.get` |  |
| [`get_session_by_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L195) | `SessionRepository.get_by_title` |  |
| [`get_session_delete_targets`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1651) | `SessionRepository.delete_targets` |  |
| [`get_session_list_row`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L846) | `SessionRepository.list_row` |  |
| [`get_session_model_config_value`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L787) | `SessionRepository.get_model_config_value` |  |
| [`get_session_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L176) | `SessionRepository.get_title` |  |
| [`get_session_title_source`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L181) | `SessionRepository.get_title_source` |  |
| [`list_recent_sessions_bounded`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1119) | `SessionRepository.list_recent_sessions` |  |
| [`list_sessions_rich`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1303) | `SessionRepository.list_sessions` |  |
| [`patch_session_model_config`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L780) | `SessionRepository.patch_model_config` |  |
| [`promote_to_session_reset`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L544) | `SessionRepository.promote_to_reset` |  |
| [`prompt_refresh_epoch`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prompt_refresh.py#L41) | `SessionRepository.prompt_refresh_epoch` | main reads it through `getattr` on the agent's store handle |
| [`publish_session_git_metadata`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L600) | `SessionRepository.publish_git_metadata` |  |
| [`reopen_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L519) | `SessionRepository.reopen` |  |
| [`request_prompt_refresh`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prompt_refresh.py#L22) | `SessionRepository.request_prompt_refresh` |  |
| [`resolve_session_by_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L203) | `SessionRepository.resolve_by_title` |  |
| [`resolve_session_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L877) | `SessionRepository.resolve_id` |  |
| [`retire_undrained_queue_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L503) | `SessionRepository.retire_undrained_queue_rows` |  |
| [`sanitize_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L49) | `sanitize_title` in `persistence/conversation/sessions.py` | a static helper, now a plain function beside the interface |
| [`search_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1542) | `SessionRepository.search_sessions` |  |
| [`session_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1571) | `SessionRepository.count_sessions` |  |
| [`session_count_by_source`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1593) | `SessionRepository.count_by_source` |  |
| [`session_count_ge`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1589) | `SessionRepository.count_at_least` |  |
| [`session_ids_with_model_config_key`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L798) | `SessionRepository.session_ids_with_model_config_key` |  |
| [`session_lifecycle_statuses`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1461) | `SessionRepository.lifecycle_statuses` |  |
| [`session_unread`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1070) | not carried | a static helper the two listing methods call; folded into `SessionRepository.list_recent_sessions` and `list_sessions` |
| [`session_yolo_enabled`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L830) | `session_yolo_enabled` in `persistence/conversation/sessions.py` | a static helper, now a plain function beside the interface |
| [`set_auto_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L170) | `SessionRepository.set_auto_title` |  |
| [`set_expiry_finalized`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L426) | not carried | no production or test caller on main; one evaluation script calls it |
| [`set_session_archived`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L953) | `SessionRepository.set_archived` |  |
| [`set_session_hidden`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1060) | `SessionRepository.set_hidden` |  |
| [`set_session_pinned`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1043) | `SessionRepository.set_pinned` |  |
| [`set_session_read`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1064) | `SessionRepository.set_read` |  |
| [`set_session_title`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L165) | `SessionRepository.set_title` |  |
| [`set_session_title_source`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_titles.py#L186) | `SessionRepository.set_title_source` |  |
| [`set_session_yolo`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L823) | `SessionRepository.set_yolo` |  |
| [`touch_session_activity`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L630) | `SessionRepository.touch_activity` |  |
| [`unarchive_recoverable_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L1004) | `SessionRepository.unarchive_recoverable` |  |
| [`update_conversation_model_config_value`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L792) | `SessionRepository.advance_onboarding_run` | its one caller passed a function to run inside the write; that update is now the operation |
| [`update_session_cwd`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L567) | `SessionRepository.update_cwd` |  |
| [`update_session_meta`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L685) | `SessionRepository.replace_session_config` |  |
| [`update_session_model`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L717) | `SessionRepository.update_model` |  |
| [`update_session_runtime_lock`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L803) | `SessionRepository.set_runtime_lock` |  |
| [`update_session_tool_names`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L705) | `SessionRepository.update_tool_pin` |  |
| [`update_system_prompt`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_sessions.py#L695) | `SessionRepository.update_system_prompt` |  |

### Messages and transcripts (49)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`append_completion_note`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_detached_results.py#L33) | `MessageRepository.append_completion_note` |  |
| [`append_delegation_delivery`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_detached_results.py#L24) | `MessageRepository.append_delegation_delivery` |  |
| [`append_message`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L396) | `MessageRepository.append` |  |
| [`append_messages_batch`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L430) | `MessageRepository.append_batch` |  |
| [`archive_and_compact`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L907) | `MessageRepository.compact` |  |
| [`assert_resume_safe`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1734) | `MessageRepository.assert_resume_safe` |  |
| [`clear_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1948) | not carried | no caller on main, in production or tests |
| [`conversation_revision`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1536) | `MessageRepository.conversation_revision` |  |
| [`deactivate_message`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1061) | `MessageRepository.deactivate_message` |  |
| [`deactivate_messages_by_display_kind`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1093) | `MessageRepository.deactivate_messages_by_display_kind` |  |
| [`display_message_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1345) | `MessageRepository.display_count` |  |
| [`find_pr_url_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1422) | `MessageRepository.find_pr_url_hits` |  |
| [`get_active_message_ids`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1821) | `MessageRepository.active_message_ids` |  |
| [`get_active_message_watermark`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L824) | `MessageRepository.active_watermark` |  |
| [`get_ancestor_display_prefix`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1754) | `LineageRepository.ancestor_display_prefix` |  |
| [`get_conversation_root`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1771) | `LineageRepository.conversation_root` |  |
| [`get_latest_todo_result`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_todo.py#L16) | `MessageRepository.latest_todo_result` |  |
| [`get_message_reactions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L549) | not carried | no production caller on main; used by tests only |
| [`get_message_role`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L619) | `MessageRepository.message_role` |  |
| [`get_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1370) | `MessageRepository.read_transcript` |  |
| [`get_messages_around`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1433) | `MessageRepository.read_around` |  |
| [`get_messages_as_conversation`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1517) | `MessageRepository.read_conversation` |  |
| [`get_resume_conversations`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1667) | `MessageRepository.read_resume_conversations` |  |
| [`get_resume_message_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1727) | not carried | no production caller on main; used by tests only |
| [`has_archived_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L814) | not carried | no production caller on main; used by tests only |
| [`has_gateway_input_owner`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1884) | `MessageRepository.has_gateway_input_owner` |  |
| [`has_platform_message_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1893) | `MessageRepository.has_platform_message_id` |  |
| [`held_row_mismatches`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prune_rewrite.py#L52) | `MessageRepository.rewritten_held_row_ids` | on main it runs only inside `rewritten_held_row_ids` and the compaction write; the check runs inside those operations |
| [`is_explicit_fork_child`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1925) | `LineageRepository.is_fork_child` |  |
| [`latest_conversation_boundary`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1931) | `MessageRepository.latest_conversation_boundary` |  |
| [`latest_conversation_role`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L610) | `MessageRepository.latest_conversation_role` |  |
| [`latest_message_row_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L598) | `MessageRepository.latest_row_id` |  |
| [`message_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1879) | `MessageRepository.count_all` |  |
| [`plan_user_turn_rewind`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_rewind.py#L113) | `MessageRepository.plan_user_turn_rewind` |  |
| [`purge_stale_tool_call_markers`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1955) | `MessageRepository.purge_stale_tool_call_markers` |  |
| [`replace_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L720) | `MessageRepository.replace_transcript` |  |
| [`replace_messages_in_transaction`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L746) | `MessageRepository.replace_transcript` |  |
| [`resolve_active_row_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1073) | `MessageRepository.resolve_active_row_id` |  |
| [`resolve_resume_session_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1452) | `LineageRepository.resolve_resume_target` |  |
| [`rewind_to_message`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1850) | `MessageRepository.rewind_user_turn` | on main it is called only by `rewind_user_turn` |
| [`rewind_user_turn`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_rewind.py#L59) | `MessageRepository.rewind_user_turn` |  |
| [`rewrite_pruned_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prune_rewrite.py#L133) | `MessageRepository.rewrite_pruned_rows` |  |
| [`rewritten_held_row_ids`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_prune_rewrite.py#L29) | `MessageRepository.rewritten_held_row_ids` |  |
| [`set_latest_matching_message_display_kind`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L499) | `MessageRepository.set_latest_matching_message_display_kind` |  |
| [`set_latest_user_api_content`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_api_content.py#L17) | `MessageRepository.set_latest_user_api_content` |  |
| [`set_message_api_content`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_api_content.py#L41) | `MessageRepository.set_message_api_content` |  |
| [`set_message_reaction`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L523) | `MessageRepository.set_reaction` |  |
| [`set_user_message_content`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L1043) | `MessageRepository.set_user_message_content` |  |
| [`take_unseen_reactions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_messages.py#L564) | `MessageRepository.take_unseen_reactions` |  |

### Compression, lineage and leases (32)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`acquire_session_turn_lease`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L744) | `CoordinationRepository.try_acquire_turn_lease` | the wait loop around the single attempt is the helper `acquire_turn_lease_waiting` beside the interface, which polls only on `StoreContention` |
| [`clear_compression_failure_cooldown`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L551) | `MessageRepository.clear_compression_cooldown` |  |
| [`finalize_orphaned_compression_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L852) | `LineageRepository.finalize_orphaned_compression_children` |  |
| [`find_live_compression_child`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L241) | not carried | no production caller on main; used by tests only |
| [`get_compression_chain`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L884) | `LineageRepository.chain` |  |
| [`get_compression_failure_cooldown`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L508) | `MessageRepository.read_compression_cooldown` |  |
| [`get_compression_failure_cooldown_row`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L516) | `MessageRepository.read_compression_cooldown_snapshot` |  |
| [`get_compression_fallback_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L572) | `LineageRepository.compression_fallback_streak` |  |
| [`get_compression_ineffective_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L581) | `LineageRepository.compression_ineffective_count` |  |
| [`get_compression_lineage`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L916) | `LineageRepository.lineage` |  |
| [`get_compression_lock_holder`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L844) | `CoordinationRepository.get_compression_lock_holder` |  |
| [`get_compression_overload_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L612) | `LineageRepository.compression_overload_streak` |  |
| [`get_compression_recovery_deadline`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L592) | `LineageRepository.compression_recovery_deadline` |  |
| [`get_compression_tip`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L897) | `LineageRepository.tip` |  |
| [`increment_compression_overload_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L621) | `LineageRepository.increment_compression_overload_streak` |  |
| [`publish_compression_child`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L373) | `LineageRepository.publish_compression_child` |  |
| [`record_compression_failure_cooldown`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L493) | `MessageRepository.record_compression_cooldown` |  |
| [`refresh_compression_lock`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L633) | `CoordinationRepository.refresh_compression_lock` |  |
| [`refresh_session_turn_lease`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L817) | `CoordinationRepository.refresh_turn_lease` |  |
| [`release_compression_lock`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L676) | `CoordinationRepository.release_compression_lock` |  |
| [`release_session_turn_lease`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L833) | `CoordinationRepository.release_turn_lease` |  |
| [`reopen_if_explicitly_closed`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L184) | `SessionRepository.reopen_if_explicitly_closed` |  |
| [`reopen_orphaned_compression_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L269) | `LineageRepository.reopen_orphaned_compression` |  |
| [`restore_compression_failure_cooldown_row`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L522) | `MessageRepository.restore_compression_cooldown` |  |
| [`session_turn_lease_expires_at`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L806) | `CoordinationRepository.turn_lease_expires_at` |  |
| [`set_compression_fallback_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L576) | `LineageRepository.set_compression_fallback_streak` |  |
| [`set_compression_ineffective_count`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L587) | `LineageRepository.set_compression_ineffective_count` |  |
| [`set_compression_overload_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L616) | `LineageRepository.set_compression_overload_streak` |  |
| [`set_compression_recovery_deadline`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L602) | `LineageRepository.set_compression_recovery_deadline` |  |
| [`stamp_legacy_compression_chains`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L227) | `LineageRepository.stamp_legacy_compression_chains` |  |
| [`try_acquire_compression_lock`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L651) | `CoordinationRepository.try_acquire_compression_lock` |  |
| [`try_acquire_session_turn_lease`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_compression.py#L719) | `CoordinationRepository.try_acquire_turn_lease` |  |

### Search and the full-text index (13)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`fts_cjk_rebuild_status`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L330) | not carried | no production caller on main; used by tests only |
| [`fts_cjk_rebuild_step`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L425) | not carried | a step of the full-text storage migration, run only by `optimize_fts_storage`; folded into `StoreAdmin.optimize_fts_storage` |
| [`fts_optimize_available`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L659) | `StoreAdmin.fts_optimize_available` |  |
| [`fts_rebuild_status`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L325) | `SessionSearch.search_index_rebuild_status` |  |
| [`fts_rebuild_step`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L412) | not carried | no production caller on main; used by tests only |
| [`get_anchored_view`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L926) | `MessageRepository.read_anchored_view` |  |
| [`list_recent_user_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L972) | not carried | no production caller on main; used by tests only |
| [`optimize_fts`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L1469) | not carried | on main it runs only inside `vacuum`, which merges full-text segments first; folded into `StoreAdmin.vacuum` |
| [`optimize_fts_storage`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L851) | `StoreAdmin.optimize_fts_storage` |  |
| [`rebuild_fts`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L1489) | `SessionSearch.rebuild_search_index` |  |
| [`retry_deferred_fts_recovery`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_schema.py#L596) | `SessionSearch.retry_deferred_search_recovery` |  |
| [`search_messages`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L1257) | `SessionSearch.search_messages` |  |
| [`search_sessions_by_id`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_search.py#L1432) | `SessionRepository.search_by_id` |  |

### Usage accounting (8)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`auxiliary_usage_by_task`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L427) | `UsageRepository.auxiliary_usage_by_task` |  |
| [`flush_for_read`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L148) | not carried | a read barrier `SessionDB`'s own session reads run before returning token totals; no caller outside `SessionDB` on main; it stays a rule inside the backend's reads |
| [`flush_token_counts`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L159) | `UsageRepository.flush_usage` |  |
| [`queue_token_counts`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L107) | `UsageRepository.queue_usage` |  |
| [`record_auxiliary_usage`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L392) | `UsageRepository.record_auxiliary_usage` |  |
| [`update_session_billing_route`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L86) | `UsageRepository.set_billing_route` |  |
| [`update_token_counts`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L285) | not carried | on main it is called only by the accounting queue's flush; folded into `UsageRepository.flush_usage` |
| [`usage_totals`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_usage.py#L456) | `UsageRepository.usage_totals` |  |

### Gateway routing and Telegram topics (40)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`adopt_orphaned_gateway_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L598) | `RoutingRepository.adopt_orphan` |  |
| [`apply_telegram_topic_migration`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L119) | `RoutingRepository.prepare_topic_storage` |  |
| [`bind_telegram_topic`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L304) | `RoutingRepository.bind_topic` |  |
| [`claim_handoff`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L980) | `CoordinationRepository.claim_handoff` |  |
| [`clear_backend_heartbeat`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L918) | `SessionMaintenance.clear_backend_heartbeat` |  |
| [`complete_handoff`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L991) | `CoordinationRepository.complete_handoff` |  |
| [`delete_telegram_topic_binding`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L259) | `RoutingRepository.delete_topic_binding` |  |
| [`disable_telegram_topic_mode`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L198) | `RoutingRepository.disable_topic_mode` |  |
| [`enable_telegram_topic_mode`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L164) | `RoutingRepository.enable_topic_mode` |  |
| [`fail_handoff`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L997) | `CoordinationRepository.fail_handoff` |  |
| [`find_latest_gateway_session_for_peer`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L496) | `RoutingRepository.latest_session_for_peer` |  |
| [`find_orphaned_gateway_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L540) | `RoutingRepository.orphaned_sessions` |  |
| [`gateway_routing_entry_for_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L383) | `RoutingRepository.routing_entry_for_session` |  |
| [`get_handoff_state`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L955) | `CoordinationRepository.get_handoff` |  |
| [`get_telegram_topic_binding`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L229) | `RoutingRepository.get_topic_binding` |  |
| [`get_telegram_topic_binding_by_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L251) | `RoutingRepository.get_topic_binding_for_session` |  |
| [`has_pending_handoffs`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L987) | `CoordinationRepository.has_pending_handoffs` |  |
| [`increment_hygiene_failure_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L649) | `CoordinationRepository.increment_hygiene_failure_streak` |  |
| [`is_telegram_session_linked_to_topic`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L341) | `RoutingRepository.is_session_linked_to_topic` |  |
| [`is_telegram_topic_mode_enabled`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L220) | `RoutingRepository.is_topic_mode_enabled` |  |
| [`list_backend_heartbeats`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L939) | not carried | no production caller on main; used by tests only |
| [`list_gateway_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L471) | `SessionRepository.list_gateway_sessions` |  |
| [`list_never_active_keyed_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L342) | `RoutingRepository.never_active_keyed_sessions` |  |
| [`list_pending_handoffs`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L968) | `CoordinationRepository.list_pending_handoffs` |  |
| [`list_telegram_topic_bindings_for_chat`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L240) | `RoutingRepository.list_topic_bindings_for_chat` |  |
| [`list_unlinked_telegram_sessions_for_user`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_telegram.py#L350) | `SessionRepository.list_unlinked_telegram_sessions` |  |
| [`load_gateway_routing_entries`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L337) | `RoutingRepository.load_routing_entries` |  |
| [`prune_never_active_keyed_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L434) | `RoutingRepository.prune_never_active`, `RoutingRepository.sweep_routing_entries_for_sessions` | main deleted the rows, then dropped their routing entries in a second write; the sweep is its own operation, and the caller runs the removal hooks between the two, in main's order |
| [`prune_stale_heartbeats`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L926) | not carried | no production caller on main; used by tests only |
| [`purge_profile_state`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L782) | `ProfileIdentityRepository.purge_profile` |  |
| [`reclaim_stale_running_handoffs`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L1011) | `CoordinationRepository.reclaim_stale_running_handoffs` |  |
| [`record_gateway_session_peer`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L234) | `RoutingRepository.record_session_peer` |  |
| [`register_backend_heartbeat`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L901) | `SessionMaintenance.register_backend_heartbeat` |  |
| [`rekey_profile_state`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L673) | `ProfileIdentityRepository.rekey_profile` |  |
| [`replace_gateway_routing_entries`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L319) | `RoutingRepository.replace_routing_entries` |  |
| [`request_handoff`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L946) | `CoordinationRepository.request_handoff` |  |
| [`reset_hygiene_failure_streak`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L667) | `CoordinationRepository.reset_hygiene_failure_streak` |  |
| [`retire_gateway_routes`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L418) | `RoutingRepository.fence_retired_routes` |  |
| [`save_gateway_routing_entry`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L304) | `RoutingRepository.upsert_routing_entry` |  |
| [`session_gateway_runtime`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_gateway.py#L855) | `gateway_runtime` in `persistence/gateway/routing.py` | a static helper, now a plain function beside the interface |

### Maintenance, export and import (22)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`adopt_session_lineage_from`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L401) | `SessionMaintenance.export_session_lineage`, `SessionMaintenance.import_sessions` | runs over two profiles' stores, so a caller-side helper runs the sequence over two store handles; it also calls `SessionRepository.reopen`, `end` and `set_archived` on the donor profile |
| [`archive_stale_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L306) | `SessionMaintenance.list_idle_archive_candidates`, `SessionMaintenance.auto_archive_lineage` | called only by `maybe_auto_archive` on main; listing the candidates and archiving each lineage are separate operations |
| [`count_open_prune_matches`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L293) | `SessionMaintenance.count_open_prune_matches` |  |
| [`count_prune_matches`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L282) | `SessionMaintenance.count_prune_matches` |  |
| [`cron_run_identity`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L273) | `SessionRepository.cron_run_identity` |  |
| [`distinct_session_cwds`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L234) | `SessionRepository.distinct_session_cwds` |  |
| [`export_all`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L374) | `SessionMaintenance.export_all` |  |
| [`export_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L347) | `SessionMaintenance.export_session` |  |
| [`export_session_lineage`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L357) | `SessionMaintenance.export_session_lineage` |  |
| [`find_foreign_import`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L177) | `SessionMaintenance.find_foreign_import` |  |
| [`import_foreign_history`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L181) | `SessionMaintenance.import_foreign_history` |  |
| [`import_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L789) | `SessionMaintenance.import_sessions` |  |
| [`list_cron_job_runs`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L248) | `SessionRepository.list_cron_job_runs` |  |
| [`list_prune_candidates`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L270) | `SessionMaintenance.list_prune_candidates` |  |
| [`list_skill_scaffolded_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_portability.py#L320) | `SessionRepository.list_skill_scaffolded_sessions` |  |
| [`logical_size_bytes`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L423) | `StoreAdmin.logical_size_bytes` |  |
| [`maybe_auto_archive`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L333) | `SessionMaintenance.list_idle_archive_candidates`, `SessionMaintenance.auto_archive_lineage`, `StateMetaRepository.get`, `StateMetaRepository.set` | a caller-side helper runs the throttled sequence over these operations |
| [`maybe_auto_prune_and_vacuum`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L478) | `SessionMaintenance.prune_sessions`, `SessionMaintenance.sweep_orphaned_sessions`, `StateMetaRepository.get`, `StateMetaRepository.set`, `StoreAdmin.try_acquire_auto_maintenance_lock`, `StoreAdmin.freelist_ratio`, `StoreAdmin.vacuum_blockers`, `StoreAdmin.vacuum`, `StoreAdmin.release_auto_maintenance_lock` | a caller-side helper runs the throttled sequence over these operations; the file steps belong to the optional admin capability |
| [`prune_empty_ghost_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L113) | `SessionMaintenance.prune_empty_ghost_sessions` |  |
| [`prune_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L364) | `SessionMaintenance.prune_sessions` |  |
| [`sweep_orphaned_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L160) | `SessionMaintenance.sweep_orphaned_sessions` |  |
| [`vacuum`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_maintenance.py#L449) | `StoreAdmin.vacuum` |  |

### Profile repair (14)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`count_messages_all`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L156) | `ProfileRepairAdmin.count_messages_all` |  |
| [`delete_gateway_routing_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L318) | `ProfileRepairAdmin.delete_gateway_routing_rows` |  |
| [`delete_moved_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L278) | `ProfileRepairAdmin.delete_moved_session` |  |
| [`export_session_for_move`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L210) | `ProfileRepairAdmin.export_session_for_move` |  |
| [`find_crossed_profile_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L77) | `ProfileRepairAdmin.find_crossed_profile_sessions` |  |
| [`find_profile_less_telegram_topic_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L137) | `ProfileRepairAdmin.find_profile_less_telegram_topic_rows` |  |
| [`import_moved_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L237) | `ProfileRepairAdmin.import_moved_session` |  |
| [`insert_gateway_routing_rows_if_absent`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L329) | `ProfileRepairAdmin.insert_gateway_routing_rows_if_absent` |  |
| [`key_profiles_for_chat`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L382) | `ProfileRepairAdmin.key_profiles_for_chat` |  |
| [`list_gateway_routing_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L132) | `ProfileRepairAdmin.list_gateway_routing_rows` |  |
| [`rekey_legacy_main_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L298) | `ProfileRepairAdmin.rekey_legacy_main_sessions` |  |
| [`relabel_sessions_to_key_profile`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L162) | `ProfileRepairAdmin.relabel_sessions_to_key_profile` |  |
| [`relabel_telegram_topic_rows`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L344) | `ProfileRepairAdmin.relabel_telegram_topic_rows` |  |
| [`sever_crossed_parents`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state_profile_repair.py#L185) | `ProfileRepairAdmin.sever_crossed_parents` |  |

### Store lifecycle and metadata (6)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`close`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1523) | not carried | closing is not a repository operation: the backend that opened the store releases it (`PersistenceBackend.close`) |
| [`get_meta`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1646) | `StateMetaRepository.get` |  |
| [`is_kanban_owned_session`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1688) | `SessionRepository.is_kanban_owned` |  |
| [`list_meta_prefix`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1710) | `StateMetaRepository.list_prefix` |  |
| [`retag_kanban_worker_sessions`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1665) | `SessionRepository.retag_worker_sessions` |  |
| [`set_meta`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_state.py#L1653) | `StateMetaRepository.set` |  |

## Own SQL on the store's connection, outside `SessionDB`

Each row is one place that takes the store's connection (`_read_ctx`, `_execute_write`, `_read_all`, `_read_one` or `_conn`) and runs its own statements on it. The note names the tables the nearest statement touches, or the constant or helper that holds the statement.

### Gateway (78)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`gateway/run_idle_exit.py:129`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/run_idle_exit.py#L129) `_read_all` in `_ledger_busy` | `AdmissionRepository.has_pending` | reads `session_admissions` |
| [`gateway/run_idle_exit.py:131`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/run_idle_exit.py#L131) `_read_all` in `_ledger_busy` | `WorkerExecutionRepository.has_live_worker` | reads `worker_executions` |
| [`gateway/run_runtime.py:222`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/run_runtime.py#L222) `_read_all` in `release_unknown_turn_markers` | `AdmissionRepository.pending_targets` | reads `session_admissions` |
| [`gateway/run_runtime.py:678`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/run_runtime.py#L678) `_read_all` in `recover_profile_native_sessions` | `AdmissionRepository.pending_targets` | reads `session_admissions` |
| [`gateway/session_a2a.py:58`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_a2a.py#L58) `_read_ctx` in `storage_source` | `SessionBindingRepository.binding_marks` | reads `state_meta` |
| [`gateway/session_acp_lifecycle.py:69`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_acp_lifecycle.py#L69) `_read_ctx` in `end_idle_acp_sessions` | `SessionBindingRepository.local_session_ids` | reads `state_meta` |
| [`gateway/session_api.py:17`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api.py#L17) `_read_ctx` in `declared_api_session` | `SessionBindingRepository.declared_session` | reads `state_meta` |
| [`gateway/session_api.py:267`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api.py#L267) `_execute_write` in `bind_api_steps` | `SessionBindingRepository.bind_api` | writes `state_meta` |
| [`gateway/session_api.py:294`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api.py#L294) `_read_ctx` in `api_storage_source` | `SessionBindingRepository.api_binding` | reads `state_meta` |
| [`gateway/session_api.py:302`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api.py#L302) `_read_ctx` in `restore_api_session` | `SessionBindingRepository.api_binding` | reads `state_meta` |
| [`gateway/session_api.py:332`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api.py#L332) `_read_ctx` in `restore_api_session` | `SessionBindingRepository.api_binding` | reads whether the route's holder has a binding of its own |
| [`gateway/session_api_media.py:124`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api_media.py#L124) `_read_ctx` in `compact_settled_api_payloads` | `AdmissionRepository.api_compaction_candidates` | reads `session_admissions` |
| [`gateway/session_api_media.py:147`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api_media.py#L147) `_execute_write` in `compact_settled_api_payloads` | `AdmissionRepository.compact_api_payloads` | writes `session_admissions`; the caller's read, compute and write ran inside the store's write; it becomes compare-and-set |
| [`gateway/session_api_turn.py:42`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api_turn.py#L42) `_read_ctx` in `api_settings` | `StateMetaRepository.get` | reads `state_meta` |
| [`gateway/session_api_turn.py:298`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_api_turn.py#L298) `_read_ctx` in `recover_authority_api_turns` | `AdmissionRepository.pending_targets` | reads `session_admissions` |
| [`gateway/session_authorities.py:265`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_authorities.py#L265) `_read_ctx` in `admission_owner` | `SessionBindingRepository.lineage_owner` | hands the connection to `local_lineage_owner` |
| [`gateway/session_authorities.py:274`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_authorities.py#L274) `_read_one` in `holds_admission` | `AdmissionRepository.has_pending` | reads `session_admissions` |
| [`gateway/session_authority.py:215`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_authority.py#L215) `_read_ctx` in `SessionAuthority.authorize` | `SessionBindingRepository.binding_marks` | reads `state_meta` |
| [`gateway/session_authority.py:774`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_authority.py#L774) `_execute_write` in `SessionAuthority._release_refused_capture` | `AdmissionRepository.record_retired_media` | the caller's function ran inside the store's write |
| [`gateway/session_automation.py:311`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_automation.py#L311) `_read_ctx` in `_process_completed` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/session_bot.py:159`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L159) `_read_ctx` in `_pin_committed` | `SessionRuntimeRepository.retired_session` | reads `state_meta` |
| [`gateway/session_bot.py:238`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L238) `_read_ctx` in `displaceable_bot_chat` | `SessionBindingRepository.binding_marks` | reads `state_meta` |
| [`gateway/session_bot.py:335`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L335) `_execute_write` in `_displace_bot_chat` | `SessionRepository.retitle_canonical_bot_chat` | writes `sessions` |
| [`gateway/session_bot.py:473`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L473) `_read_ctx` in `_admission_at` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/session_bot.py:758`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L758) `_read_ctx` in `recover_bot_deliveries` | `SessionBindingRepository.binding_marks` | reads `state_meta` |
| [`gateway/session_bot.py:923`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_bot.py#L923) `_read_ctx` in `_not_sent_record` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/session_deferred_pick.py:66`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L66) `_execute_write` in `defer_pick` | `SessionRuntimeRepository.defer_model_pick` | writes `state_meta` |
| [`gateway/session_deferred_pick.py:75`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L75) `_read_ctx` in `reask_on_attach.read` | `SessionRuntimeRepository.deferred_pick` | reads `state_meta` |
| [`gateway/session_deferred_pick.py:130`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L130) `_execute_write` in `_commit_level` | `SessionRuntimeRepository.replace_deferred_pick` | writes `state_meta` |
| [`gateway/session_deferred_pick.py:141`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L141) `_read_ctx` in `apply_deferred_pick.read` | `SessionRuntimeRepository.deferred_pick` | reads `state_meta` |
| [`gateway/session_deferred_pick.py:167`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L167) `_execute_write` in `apply_deferred_pick` | `SessionRuntimeRepository.mark_deferred_pick_asked` | writes `state_meta` |
| [`gateway/session_deferred_pick.py:177`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_deferred_pick.py#L177) `_execute_write` in `apply_deferred_pick` | `SessionRuntimeRepository.forget_deferred_pick` | writes `state_meta` |
| [`gateway/session_group_controls.py:330`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_group_controls.py#L330) `_read_ctx` in `_read_bot_sessions` | `SessionRepository.roster_sessions` | reads `sessions` |
| [`gateway/session_history_mount.py:24`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_history_mount.py#L24) `_read_ctx` in `_reader` | `SessionBindingRepository.history_binding` | hands the connection to `history_binding` |
| [`gateway/session_history_mount.py:41`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_history_mount.py#L41) `_read_ctx` in `mount_history` | `SessionBindingRepository.api_binding` | reads `state_meta` |
| [`gateway/session_history_mount.py:62`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_history_mount.py#L62) `_read_ctx` in `require_history_leaf` | `SessionRuntimeRepository.delete_footprint` | reads `sessions` |
| [`gateway/session_hosted_rpc.py:113`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_rpc.py#L113) `_execute_write` in `HostedRoomAuthorityRPC._create` | `HostedRoomRepository.label_room_session` | writes `sessions` |
| [`gateway/session_hosted_service.py:97`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_service.py#L97) `_read_ctx` in `CanonicalHostedRoomService.bindings` | `HostedRoomRepository.owned_rooms` | reads `state_meta` |
| [`gateway/session_hosted_service.py:128`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_service.py#L128) `_execute_write` in `CanonicalHostedRoomService.authorize_room` | `HostedRoomRepository.claim_owner` | writes `state_meta` |
| [`gateway/session_hosted_service.py:131`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_service.py#L131) `_read_ctx` in `CanonicalHostedRoomService._owner` | `HostedRoomRepository.owner` | reads `state_meta` |
| [`gateway/session_hosted_service.py:195`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_service.py#L195) `_read_ctx` in `CanonicalHostedRoomService._resolve_member_transport.authorize` | `HostedRoomRepository.member_authorized` | hands the connection to `authorized` |
| [`gateway/session_hosted_transport.py:251`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_transport.py#L251) `_execute_write` in `install_hosted_transport.produce` | `HostedRoomRepository.bind_transport` | writes `state_meta` |
| [`gateway/session_hosted_transport.py:278`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_hosted_transport.py#L278) `_read_ctx` in `_check_remote_hosted_admission` | `HostedRoomRepository.transport_binding` | reads `state_meta` |
| [`gateway/session_ingress_media.py:213`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_ingress_media.py#L213) `_read_ctx` in `reconcile_native_retry` | `AdmissionRepository.find` | reads `session_admissions` |
| [`gateway/session_ingress_media.py:473`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_ingress_media.py#L473) `_read_ctx` in `sweep_settled_media` | `AdmissionRepository.settled_media` | reads `session_admissions` |
| [`gateway/session_ingress_media.py:558`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_ingress_media.py#L558) `_read_ctx` in `release_unheld_media` | `AdmissionRepository.history_mentions` | reads `messages` |
| [`gateway/session_ingress_media.py:592`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_ingress_media.py#L592) `_execute_write` in `release_unheld_media` | `AdmissionRepository.unheld_media` | the caller's function ran inside the store's write and unlinked files there; the operation returns the paths no row holds and the caller unlinks them afterwards |
| [`gateway/session_lifecycle.py:111`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_lifecycle.py#L111) `_read_ctx` in `SessionLifecycleMixin._local_receipt_target` | `SessionBindingRepository.receipt` |  |
| [`gateway/session_lifecycle.py:134`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_lifecycle.py#L134) `_read_ctx` in `SessionLifecycleMixin._api_bound` | `SessionBindingRepository.api_binding` | reads `state_meta` |
| [`gateway/session_lifecycle.py:141`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_lifecycle.py#L141) `_read_ctx` in `SessionLifecycleMixin._api_bound` | `SessionBindingRepository.api_binding` | reads `state_meta` |
| [`gateway/session_listing.py:73`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_listing.py#L73) `_read_ctx` in `stored_picker_sessions` | `SessionBindingRepository.authorize_history` | hands the connection to `authorize_history` |
| [`gateway/session_live_listing.py:46`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_live_listing.py#L46) `_read_ctx` in `_store_facts` | `SessionRepository.live_listing_facts` | reads `state_meta`, `sessions` |
| [`gateway/session_local_adoption.py:32`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_adoption.py#L32) `_read_ctx` in `_due` | `SessionBindingRepository.compression_adoptable` | hands the connection to `adoptable_compression` |
| [`gateway/session_local_migration.py:59`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_migration.py#L59) `_read_ctx` in `resolve_local_target` | `SessionBindingRepository.binding_marks` | reads `state_meta` |
| [`gateway/session_local_migration.py:179`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_migration.py#L179) `_read_ctx` in `follow_bot_chat` | `SessionBindingRepository.conversation_ids` | hands the connection to `local_conversation_ids` |
| [`gateway/session_local_recovery.py:82`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_recovery.py#L82) `_read_ctx` in `_with_untracked_compression` | `SessionBindingRepository.compression_adoptable` | hands the connection to `adoptable_compression` |
| [`gateway/session_local_recovery.py:144`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_recovery.py#L144) `_read_ctx` in `_stray_route_target` | `SessionBindingRepository.target_has_history` | hands the connection to `unused_session` |
| [`gateway/session_local_recovery.py:167`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_recovery.py#L167) `_read_ctx` in `restore_local_session` | `SessionBindingRepository.validate_lineage` | hands the connection to `validate_local_lineage` |
| [`gateway/session_local_recovery.py:443`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_recovery.py#L443) `_execute_write` in `release_handed_off_receipts` | `SessionBindingRepository.release_handed_off_receipts` | hands the connection to `_epoch`, `hand_off_conversations`, `moved_receipts`, `write` |
| [`gateway/session_local_recovery.py:451`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_local_recovery.py#L451) `_read_ctx` in `local_receipt_ids` | `SessionBindingRepository.boot_session_ids` | runs `_BOOT_RECEIPTS_SQL` |
| [`gateway/session_managed_worker.py:499`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_managed_worker.py#L499) `_read_ctx` in `_execution_tip` | `WorkerExecutionRepository.execution_session` | reads `worker_executions` |
| [`gateway/session_mutations.py:55`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_mutations.py#L55) `_read_ctx` in `_authorize_control` | `SessionBindingRepository.authorize_history` | the history-claim check and the authorization ran on one connection; both run inside the operation |
| [`gateway/session_mutations.py:98`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_mutations.py#L98) `_read_ctx` in `_owner_ref` | `SessionBindingRepository.lineage_owner` | hands the connection to `local_lineage_owner` |
| [`gateway/session_queued_controls.py:44`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_queued_controls.py#L44) `_read_ctx` in `_interactive` | `SessionRepository.list_row` | reads `sessions` |
| [`gateway/session_results.py:80`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_results.py#L80) `_read_ctx` in `finish_result` | `AdmissionRepository.settled_result` | reads `state_meta` |
| [`gateway/session_results.py:113`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_results.py#L113) `_read_ctx` in `admission_result` | `AdmissionRepository.settled_result` | reads `state_meta` |
| [`gateway/session_settlement_recovery.py:30`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_settlement_recovery.py#L30) `_execute_write` in `_mark_unknown` | `AdmissionRepository.mark_unknown` | writes `sessions` |
| [`gateway/session_unattended_unknown.py:48`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_unattended_unknown.py#L48) `_read_ctx` in `settle_recovered_unattended` | `AdmissionRepository.list_unknown` | reads `session_admissions` |
| [`gateway/session_viewer_close.py:47`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_viewer_close.py#L47) `_read_ctx` in `_busy` | `AdmissionRepository.ledger_busy` | runs `_BUSY_SQL` |
| [`gateway/session_viewer_close.py:117`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_viewer_close.py#L117) `_execute_write` in `_persist_close` | `SessionRuntimeRepository.store_viewer_close` | writes `state_meta` |
| [`gateway/session_viewer_close.py:131`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_viewer_close.py#L131) `_execute_write` in `forget_persisted_close` | `SessionRuntimeRepository.forget_viewer_close` | writes `state_meta` |
| [`gateway/session_viewer_close.py:153`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_viewer_close.py#L153) `_read_ctx` in `rearm_persisted_closes` | `SessionRuntimeRepository.viewer_closes` | reads `state_meta` |
| [`gateway/session_viewer_close.py:246`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_viewer_close.py#L246) `_read_ctx` in `_idle_s` | `SessionRepository.last_active` | reads `sessions` |
| [`gateway/session_worker.py:52`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_worker.py#L52) `_read_ctx` in `_verify` | `WorkerExecutionRepository.verify_claim` | reads `worker_executions` |
| [`gateway/session_worker_child.py:32`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_worker_child.py#L32) `_read_ctx` in `delegation_limits` | `WorkerExecutionRepository.execution_session` | reads `worker_executions` |
| [`gateway/session_worker_delegation.py:222`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_worker_delegation.py#L222) `_read_ctx` in `worker_delegation_request.persist_and_publish` | `WorkerDelegationLedger.pending_delegation_event` | hands the connection to `_owned` |
| [`gateway/session_worker_reservation.py:110`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_worker_reservation.py#L110) `_execute_write` in `reserve_admission_worker` | `WorkerExecutionRepository.reserve_for_admission` | writes `worker_executions` |
| [`gateway/session_worker_reservation.py:134`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/session_worker_reservation.py#L134) `_execute_write` in `lose_admission_worker` | `WorkerExecutionRepository.lose_reservation` | writes `sessions` |

### Gateway platforms (API server, webhooks) (8)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`gateway/platforms/api_server.py:2637`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/api_server.py#L2637) `_execute_write` in `APIServerAdapter._handle_create_session` | `SessionRepository.create_exclusive` | writes `sessions` |
| [`gateway/platforms/api_server_authority_runs.py:60`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/api_server_authority_runs.py#L60) `_read_ctx` in `run_admission` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/platforms/api_server_response_admissions.py:20`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/api_server_response_admissions.py#L20) `_read_ctx` in `_request_admission_rows` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/platforms/api_server_room_dispatch.py:62`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/api_server_room_dispatch.py#L62) `_execute_write` in `_ensure_hosted_member_session` | `HostedRoomRepository.ensure_room_member_session` | writes `sessions`; the caller's function ran inside the store's write: read the row, check the title, insert |
| [`gateway/platforms/webhook_delivery.py:89`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/webhook_delivery.py#L89) `_read_all` in `retained_destination` | `AdmissionRepository.webhook_ingress_payloads` | reads `session_admissions` |
| [`gateway/platforms/webhook_ingress.py:238`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/webhook_ingress.py#L238) `_read_all` in `_committed` | `AdmissionRepository.match` | reads `session_admissions` |
| [`gateway/platforms/webhook_ingress.py:287`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/webhook_ingress.py#L287) `_execute_write` in `finalize_webhook` | `SessionRuntimeRepository.end_after_settlement` | writes `sessions`, `runtime_epoch`, `session_admissions` |
| [`gateway/platforms/webhook_ingress.py:296`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/webhook_ingress.py#L296) `_read_all` in `recover_webhook_finalizations` | `AdmissionRepository.unfinalized_webhook_admissions` | reads `sessions`, `session_admissions` |

### CLI (14)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`hermes_cli/gateway_session_store.py:277`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/gateway_session_store.py#L277) `_read_ctx` in `GatewaySessionStore._title_holder` | `SessionRepository.title_holder` | reads `sessions` |
| [`hermes_cli/gateway_session_store.py:344`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/gateway_session_store.py#L344) `_read_ctx` in `GatewaySessionStore.delete_session_if_empty` | `SessionRepository.is_empty_candidate` | reads `sessions`, `messages` |
| [`hermes_cli/gateway_session_store.py:408`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/gateway_session_store.py#L408) `_read_all` in `SurfaceLabelReader._has_created_source_column` | `SessionRepository.records_created_surface` | reads `sessions` |
| [`hermes_cli/prune_advisor.py:174`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/prune_advisor.py#L174) `_read_one` in `advise` | `SessionMaintenance.prune_reclaim_estimate` | reads `sessions`; the three reads become one operation |
| [`hermes_cli/prune_advisor.py:181`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/prune_advisor.py#L181) `_read_one` in `advise` | `SessionMaintenance.prune_reclaim_estimate` | reads `messages`, `sessions` |
| [`hermes_cli/prune_advisor.py:186`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/prune_advisor.py#L186) `_read_one` in `advise` | `SessionMaintenance.prune_reclaim_estimate` | reads `messages` |
| [`hermes_cli/prune_advisor.py:266`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/prune_advisor.py#L266) `_read_all` in `_row_bytes_sql` | `SessionMaintenance.prune_reclaim_estimate` | reads `messages`; the column probe that shapes the byte estimate becomes a rule inside the operation |
| [`hermes_cli/sessions_adopt.py:38`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/sessions_adopt.py#L38) `_read_ctx` in `adoptable_sessions` | `SessionBindingRepository.legacy_adoption_scan` | reads `sessions` |
| [`hermes_cli/sessions_cmd.py:159`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/sessions_cmd.py#L159) `_conn` in `_cmd_repair` | `StoreAdmin.session_row_count` | reads `sessions` |
| [`hermes_cli/update_cmd_maint.py:143`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_cmd_maint.py#L143) `_conn` in `_print_fts_optimize_available_notice` | `StoreAdmin.fts_storage_notice` | reads `state_meta` |
| [`hermes_cli/update_cmd_maint.py:144`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_cmd_maint.py#L144) `_conn` in `_print_fts_optimize_available_notice` | `StoreAdmin.fts_storage_notice` | reads `state_meta` |
| [`hermes_cli/update_cmd_maint.py:148`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_cmd_maint.py#L148) `_conn` in `_print_fts_optimize_available_notice` | `StoreAdmin.fts_storage_notice` | reads `state_meta` |
| [`hermes_cli/update_cmd_maint.py:152`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_cmd_maint.py#L152) `_conn` in `_print_fts_optimize_available_notice` | `StoreAdmin.fts_storage_notice` |  |
| [`hermes_cli/update_cmd_maint.py:156`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_cmd_maint.py#L156) `_conn` in `_print_fts_optimize_available_notice` | `StoreAdmin.fts_storage_notice` | reads `state_meta` |

### Dashboard (7)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`hermes_cli/web_routers/analytics.py:81`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_routers/analytics.py#L81) `_conn` in `_rows` | `UsageAnalytics.daily_usage`, `UsageAnalytics.session_usage_by_model`, `UsageAnalytics.session_usage_totals`, `UsageAnalytics.session_tool_calls_by_route`, `UsageAnalytics.session_usage_by_route` | a helper that ran each dashboard query on the store's connection |
| [`hermes_cli/web_routers/analytics.py:321`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_routers/analytics.py#L321) `_conn` in `_get_models_analytics` | `UsageAnalytics.call_usage_by_route` | reads `session_model_usage`, `sessions` |
| [`hermes_cli/web_routers/sessions.py:794`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_routers/sessions.py#L794) `_read_one` in `_timeline_session_id.owned` | `SessionRepository.get` | reads `sessions` |
| [`hermes_cli/web_server_profiles.py:383`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_server_profiles.py#L383) `_conn` in `_aux_usage_rows` | `UsageAnalytics.auxiliary_usage_by_model_task` | reads `session_model_usage`, `sessions` |
| [`hermes_cli/web_server_sessions.py:51`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_server_sessions.py#L51) `_conn` in `_session_latest_descendant` | `SessionRepository.descendants` | runs `_DESCENDANTS_SQL` |
| [`hermes_cli/web_server_sessions.py:175`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_server_sessions.py#L175) `_read_ctx` in `_mutate_offline_store.run` | `SessionRuntimeRepository.current_epoch` | reads `runtime_epoch` |
| [`hermes_cli/web_server_sessions.py:381`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/web_server_sessions.py#L381) `_conn` in `_open_session_db_at_path._open_probed` | `StoreAdmin.schema_drift_reason` | the read probe before a browse open; on drift, `StoreAdmin.reconcile_drift_for_browse` |

### TUI gateway (3)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`tui_gateway/methods_profiles.py:114`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tui_gateway/methods_profiles.py#L114) `_conn` in `_latest_message_preview` | `MessageRepository.latest_dialogue_message` | reads `messages` |
| [`tui_gateway/session_lifecycle.py:155`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tui_gateway/session_lifecycle.py#L155) `_execute_write` in `_end_unless_ledger_busy` | `SessionRuntimeRepository.end_unless_ledger_busy` | writes `sessions` |
| [`tui_gateway/session_lifecycle.py:196`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tui_gateway/session_lifecycle.py#L196) `_read_ctx` in `_canonical_ledger_refusal` | `SessionRuntimeRepository.pending_ledger_status` | runs `_CANONICAL_PENDING_SQL` |

### ACP server (1)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`acp_adapter/catalog.py:29`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/acp_adapter/catalog.py#L29) `_read_ctx` in `_local_owners` | `SessionBindingRepository.list_lineages` | reads `state_meta` |

### Agent and tools (2)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`agent/insights.py:166`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/agent/insights.py#L166) `_conn` in `InsightsEngine.__init__` | `UsageAnalytics.insight_sessions`, `UsageAnalytics.insight_tool_result_counts`, `UsageAnalytics.insight_tool_call_payloads`, `UsageAnalytics.insight_skill_call_payloads`, `UsageAnalytics.insight_message_stats`, `UsageAnalytics.insight_model_usage` | the engine took the store's connection for all its queries; its index and column probes become rules inside those reads |
| [`tools/session_search_tool.py:219`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tools/session_search_tool.py#L219) `_conn` in `_get_message_storage_state._lookup` | `MessageRepository.message_storage_state` | reads `messages` |

## Direct opens of the store's files, outside `SessionDB`

Each row is one place that opens `state.db` (or the root `shared-state.db` that holds hosted rooms) with its own SQLite connection instead of going through the store.

### Gateway (10)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`gateway/delivery_ledger.py:184`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/delivery_ledger.py#L184) in `_connect` | the delivery-obligation operations of `CoordinationRepository` (`record_delivery_obligation`, `mark_obligation_attempting`, `mark_obligation_delivered`, `sweep_recoverable_obligations`, `release_runtime_obligation_claim` and the rest of that group) | the ledger opened its own connection with a 10 s busy timeout; its statements now run on the store's one writer, with the same patience |
| [`gateway/hosted_room_attachments.py:421`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_room_attachments.py#L421) in `HostedRoomAttachmentStore._connect` | the operations of `HostedRoomAttachmentRepository` (`prepare`, `put`, `read`, `read_range`, `describe` and the rest) | `prepare` runs the attachment file's first-use setup, which main ran when it built the attachment store for a user message |
| [`gateway/hosted_room_policy_checkpoint.py:138`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_room_policy_checkpoint.py#L138) in `HostedRoomPolicyCheckpoint._connect` | the operations of `HostedRoomPolicyRepository` (`snapshot`, `compact_completed`, `events_for_task`, `publication_exists`) |  |
| [`gateway/hosted_rooms.py:1021`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_rooms.py#L1021) in `_probe` | `HostedRoomRepository.probe_hosted_room` |  |
| [`gateway/hosted_rooms_common.py:101`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_rooms_common.py#L101) in `open_sqlite` | not carried | the hosted-room connection helpers move inside the backend; every hosted-room statement runs behind the six hosted-room repositories |
| [`gateway/hosted_rooms_common.py:126`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_rooms_common.py#L126) in `connect` | not carried | as above: a connection per call becomes the backend's writer for the hosted-room file |
| [`gateway/hosted_rooms_legacy_import.py:84`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/hosted_rooms_legacy_import.py#L84) in `_copy_rows` | not carried | a rule inside the backend: the one-time copy of hosted-room tables out of `state.db` runs when the backend opens the shared hosted-room file |
| [`gateway/lifecycle_ledger.py:258`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/lifecycle_ledger.py#L258) in `check_state_db_integrity` | `StoreAdmin.integrity_check` |  |
| [`gateway/lifecycle_ledger.py:276`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/lifecycle_ledger.py#L276) in `_state_db_journal_mode` | `StoreAdmin.journal_mode` |  |
| [`gateway/readiness.py:40`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/readiness.py#L40) in `_probe_state_db` | `StorageHealth.probe` |  |

### Gateway platforms (API server, webhooks) (1)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`gateway/platforms/api_server_response_store.py:187`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/gateway/platforms/api_server_response_store.py#L187) in `ResponseStore._settle_terminal_admissions` | `AdmissionRepository.terminal_ids` | the response store read the admissions table on its own read-only connection |

### CLI (24)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`hermes_cli/approvals_suggest.py:95`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/approvals_suggest.py#L95) in `_connect_readonly` | `MessageRepository.terminal_tool_call_payloads`, `MessageRepository.blocked_tool_result_payloads` | the scan read the terminal calls and the results that show a call was blocked on one read-only connection; each read is its own operation |
| [`hermes_cli/backup.py:369`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup.py#L369) in `_query_ro_sqlite` | `StoreAdmin.verify_file` |  |
| [`hermes_cli/backup_restore.py:189`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_restore.py#L189) in `_restore_epoch` | `StoreAdmin.restore_epoch_floor` |  |
| [`hermes_cli/backup_restore.py:229`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_restore.py#L229) in `_restore_epoch_source` | `StoreAdmin.restore_from` | the runtime-epoch floor written into the staged copy is part of the restore |
| [`hermes_cli/backup_restore.py:272`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_restore.py#L272) in `_restore_db_pages` | `StoreAdmin.restore_from` | a store file is restored through `StoreAdmin.restore_from`; this page copy stays for the other databases a backup holds |
| [`hermes_cli/backup_restore.py:280`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_restore.py#L280) in `_restore_db_pages` | `StoreAdmin.restore_from` | as above |
| [`hermes_cli/backup_restore.py:553`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_restore.py#L553) in `_count_session_rows` | `StoreAdmin.session_row_counts` |  |
| [`hermes_cli/backup_sqlite.py:167`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_sqlite.py#L167) in `_safe_copy_db` | `StoreAdmin.backup_to` | backups copy the store's files through `StoreAdmin.backup_to`; this copy routine stays for the other databases a backup holds and for the Desktop pre-flight below |
| [`hermes_cli/backup_sqlite.py:169`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_sqlite.py#L169) in `_safe_copy_db` | `StoreAdmin.backup_to` | as above |
| [`hermes_cli/backup_sqlite.py:237`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/backup_sqlite.py#L237) in `preflight_state_db` | not carried | the Desktop app runs this pre-flight with the standard library only before it stops its backend, so it must work when Hermes's own imports cannot load; it keeps its own copy of `state.db` and its own check of that copy |
| [`hermes_cli/doctor_state.py:283`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/doctor_state.py#L283) in `_session_count` | `StoreAdmin.session_row_count` |  |
| [`hermes_cli/doctor_state.py:309`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/doctor_state.py#L309) in `_write_health_reason` | `StoreAdmin.write_health_reason` |  |
| [`hermes_cli/doctor_state.py:311`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/doctor_state.py#L311) in `_write_health_reason` | `StoreAdmin.write_health_reason` |  |
| [`hermes_cli/install_state.py:442`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/install_state.py#L442) in `_messages` | `MessageRepository.has_any_message` |  |
| [`hermes_cli/kanban_owner_recovery.py:37`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/kanban_owner_recovery.py#L37) in `_admission_row` | `AdmissionRepository.match` | reads the admission row an owner's receipt names, in the owner profile's `state.db` opened read-only; a store opened on that profile answers it |
| [`hermes_cli/observability/shared_metrics_snapshot.py:102`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/observability/shared_metrics_snapshot.py#L102) in `_first_session_started_at` | `SessionRepository.first_session_started_at` |  |
| [`hermes_cli/session_recovery.py:227`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/session_recovery.py#L227) in `_connect` | `StoreAdmin.recover_transcripts` |  |
| [`hermes_cli/session_recovery.py:912`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/session_recovery.py#L912) in `_verify_recovered_database` | `StoreAdmin.recover_transcripts` |  |
| [`hermes_cli/session_recovery.py:1136`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/session_recovery.py#L1136) in `_recover_via_lost_and_found` | `StoreAdmin.recover_transcripts` |  |
| [`hermes_cli/sessions_cmd_journal_mode.py:85`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/sessions_cmd_journal_mode.py#L85) in `cmd_set_journal_mode` | `StoreAdmin.set_journal_mode` |  |
| [`hermes_cli/update_downgrade_guard.py:73`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_downgrade_guard.py#L73) in `_has_ledger_rows` | `StoreAdmin.has_runtime_ledger_rows` |  |
| [`hermes_cli/update_downgrade_guard.py:89`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/update_downgrade_guard.py#L89) in `_pre_runtime_snapshot` | `StoreAdmin.has_runtime_ledger_table` |  |
| [`hermes_cli/worktree_ops.py:824`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/worktree_ops.py#L824) in `_tree_still_served` | `SessionMaintenance.tree_served_sessions` |  |
| [`hermes_cli/worktree_ops.py:877`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/hermes_cli/worktree_ops.py#L877) in `_retained_tree_is_live` | `SessionMaintenance.retained_tree_is_live` |  |

### Agent and tools (2)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`tools/async_delegation.py:136`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tools/async_delegation.py#L136) in `_connect` | the delegation-ledger operations of `CoordinationRepository` (`record_delegation_dispatch`, `record_delegation_completion`, `claim_delivery`, `list_orphan_completion_offers`, `get_admitted_completion` and the rest of that group) | the ledger opened its own connection; its statements now run on the store's one writer |
| [`tools/tool_result_storage.py:112`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/tools/tool_result_storage.py#L112) in `referenced_spillover_names` | `MessageRepository.spillover_reference_rows` |  |

### Scripts (1)

| Today (SessionDB method or call site) | Replaced by | Note |
|---|---|---|
| [`scripts/profile-tui.py:67`](https://github.com/NousResearch/hermes-agent/blob/ed1afb082eb3e46cf2edae9d8f68fb67b09ee4df/scripts/profile-tui.py#L67) in `pick_longest_session` | `SessionRepository.longest_session_id` |  |
