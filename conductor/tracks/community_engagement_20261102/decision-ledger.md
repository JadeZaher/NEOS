---
type: Decision Ledger
title: Engagement decisions and credential gate
---
| ID | Decision | Status / safe implementation |
|---|---|---|
| E01 | Product entry | Delegated: public community preview -> existing join gates -> existing Home with activity and updates. |
| E02 | Feed scope | Delegated: chronological real community events, no new generic posting/ranking/reactions. |
| E03 | Email provider | Resend selected after official-document research and both design review cycles; HTTP transport adapter isolates the provider. Owner account and sender setup remains E04. |
| E04 | Sender identity and account | Owner gate: choose verified sending domain/from/reply-to, create account/key and webhook signing secret. No provider account or purchase performed. |
| E05 | External activation | Owner gate: supply credentials in Railway secrets, finish DNS verification, explicitly activate and name initial test recipient. Until then sending off. |
| E06 | SMS | Optional Twilio account/Verify service/Messaging Service credentials and sender setup; no voice calling. Disabled until configured and contact verified. |
| E07 | Push | Native Web Push/VAPID generated locally; deployment/configuration possible without SaaS account, actual enrollment/send remains explicitly enabled. |
| E08 | Social expansion | Deferred: generic topics/person follows, reactions/posts, recommendation ranking, native apps. Current source scopes have concrete visibility policies. |
| E09 | Notification defaults | In-app available; external all off. Granular explicit subscriptions; no retroactive inference from legacy push preferences. |
| E10 | Human validation | Continue to distinguish automated flows from member comprehension/trust/retention evidence. |
| E11 | Anonymous opportunity previews | Preserve current policy: shares marked public are visible to signed-in users. Anonymous community previews show deliberately public community description; opportunity titles require sign-in and current source policy. Broadening publication audience needs an owner decision and is not inferred from adding a community landing page. |
| E12 | Expanded follow consent | Delegated conservative cutoff: adding categories/channels or unmuting resets the entire follow activation time. Old external events cannot backfill; pending older events for unchanged categories on that follow are also excluded. |
| E13 | Digest overflow | Delegated bounded manifests: at most50 events per manifest; additional events receive numbered manifests for the same cadence window. Frozen manifests cannot accept later events. |
