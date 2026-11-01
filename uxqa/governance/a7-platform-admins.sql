-- Wave C, owner check A7: who is a platform admin once wave C is deployed.
-- Read-only. Run it in the production database console (Railway -> Postgres -> Query) before or right after the push.
-- Platform admin = an ACTIVE member row in the home ecosystem whose profile is co_creator or builder.
-- Home = the id pinned in app_settings by revision v1b4e7c9d2f5; before that revision runs, the oldest ecosystem
-- whose name is "omnione" ignoring case and spaces (what the revision will pin).
-- granted_by_record = false means nobody recorded granting that profile: until 2026-10-31 members could pick
-- co_creator/builder for themselves, so confirm each of those people should run the platform.
WITH home AS (
  SELECT COALESCE(
    (SELECT (value->>'ecosystem_id')::uuid FROM app_settings WHERE key = 'platform_home_ecosystem_id'),
    (SELECT id FROM ecosystems
      WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') = 'omnione'
      ORDER BY created_at, founded_date NULLS LAST, id LIMIT 1)
  ) AS id
)
SELECT u.username,
       m.display_name,
       m.member_id,
       m.profile,
       m.role,
       m.created_at,
       EXISTS (
         SELECT 1 FROM member_status_transitions t
          WHERE t.member_id = m.id AND t.trigger = 'profile_grant' AND t.to_status = 'profile:' || m.profile
       ) AS granted_by_record
  FROM members m
  JOIN home h ON m.ecosystem_id = h.id
  LEFT JOIN users u ON u.id = m.user_id
 WHERE m.current_status = 'active'
   AND m.profile IN ('co_creator', 'builder')
 ORDER BY granted_by_record, m.created_at;
