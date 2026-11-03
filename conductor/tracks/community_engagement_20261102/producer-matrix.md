---
type: Integration Specification
title: Event producers and canonical occurrence identity
---
| Family | Occurrence | Producer point | Identity | Audience |
|---|---|---|---|---|
| governance | proposal enters lifecycle stage, including automatic transitions and return to Advice | services/act_gates._enter_proposal_stage (all callers) | persisted mutation occurrence UUID generated on validated actual entry; subsequent notification replay reuses it | currently eligible primary/shared ecosystems |
| governance | agreement enters stage | services/act_gates._enter_agreement_stage | ceremony.id (explicitly assign before use) | currently eligible primary/shared ecosystems |
| governance | ratified proposal registered as new agreement or amendment | api/agreements.register_ratified_proposal | registration ceremony.id, explicitly assigned | currently eligible primary/shared ecosystems and existing agreement followers |
| opportunities | share/need created, edited, moved, hidden/restored/deleted | services/exchange publication mutation functions | created record.id for creation; persisted mutation occurrence UUID for changes | current source-policy eligible members; removed/hidden source is suppressed |
| messages | ordinary conversation message | services/member_messaging.post_message | message.id | currently authorized conversation recipients excluding sender |
| messages | initial and subsequent opportunity response | services/exchange.respond, both direct Message branches | message.id | currently authorized conversation recipients excluding sender |
| collaboration | proposed, approved/activated, reviewed, ended | services/exchange corresponding mutation functions | creation record.id / approval.id where available / persisted mutation occurrence UUID | both current domain/ecosystem sides via existing policy |
| community | actual domain/team participation change | canonical team/domain join/add/remove handlers and personal-operator join_domain after successful state change | persisted mutation occurrence UUID; no event on no-op | authorized subgroup participants; do not expose member identities |

Source hooks call record_event before parent transaction commits; never start provider calls. Event actor derives User behind actual Member. Automatic transitions may have null actor; never invent actor. Generated occurrence UUIDs are stored as event_key once per actual domain mutation, not generated on event redispatch. Domain write retry semantics remain domain-owned.
Tests exercise all message branches, automatic+manual transition parity, legitimate Advice->Consent->Advice occurrences, duplicate record_event replay, cross-ecosystem dual-member dedup and transaction rollback.
