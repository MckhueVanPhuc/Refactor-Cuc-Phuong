-- M03 migration 4b — public projections read by M01 (tasks M03 T184; publication-public-contract §2–§3;
-- Physical §3, §7.1, §9; BR-M03-C11, C15, C16, G08, G09, T08).
-- Owner-executed views with security_barrier and a field whitelist: no closure reason, no user id, no draft, no
-- historical snapshot. Columns are the snake_case of the contract's top-level keys; nested values (bilingual texts,
-- arrays, objects) are jsonb with camelCase keys (decision B-2). Functions called in a view are checked against
-- the reader, so the views use built-in functions only.

create view api.published_routes with (security_barrier = true) as
select
  r.route_id,
  r.status,
  t.complete -> 'name' as name,
  t.complete -> 'shortDescription' as short_description,
  t.complete -> 'description' as description,
  t.complete -> 'startingPoint' as starting_point,
  jsonb_build_object('sourceRef', thumb.source_ref) as thumbnail,
  coalesce((
    select jsonb_agg(jsonb_build_object('sourceRef', m.source_ref)
      || case when nullif(btrim(g #>> '{caption,vi}', E' \t\r\n'), '') is not null
                and nullif(btrim(g #>> '{caption,en}', E' \t\r\n'), '') is not null
              then jsonb_build_object('caption', jsonb_build_object('vi', btrim(g #>> '{caption,vi}', E' \t\r\n'),
                                                                    'en', btrim(g #>> '{caption,en}', E' \t\r\n')))
              else '{}'::jsonb end
      order by n)
    from jsonb_array_elements(coalesce(c -> 'galleryItems', '[]')) with ordinality x(g, n)
    join app.media m on m.media_id::text = g ->> 'mediaId'), '[]'::jsonb) as gallery,
  case when map.source_ref is null then null else jsonb_build_object('sourceRef', map.source_ref)
    || coalesce(case when t.complete ? 'routeMapCaption' then jsonb_build_object('caption', t.complete -> 'routeMapCaption') end, '{}'::jsonb)
  end as route_map,
  t.complete -> 'participationRequirements' as participation_requirements,
  t.complete -> 'preparation' as preparation,
  t.complete -> 'bestTime' as best_time,
  t.complete -> 'safetyWarning' as safety_warning,
  coalesce((
    select jsonb_agg(jsonb_build_object('vi', btrim(h ->> 'vi', E' \t\r\n'), 'en', btrim(h ->> 'en', E' \t\r\n')) order by n)
    from jsonb_array_elements(coalesce(c -> 'highlights', '[]')) with ordinality x(h, n)
    where nullif(btrim(h ->> 'vi', E' \t\r\n'), '') is not null and nullif(btrim(h ->> 'en', E' \t\r\n'), '') is not null),
    '[]'::jsonb) as highlights,
  (c ->> 'distanceKm')::numeric as distance_km,
  (c ->> 'durationMin')::integer as duration_min,
  c ->> 'difficulty' as difficulty,
  -- derived, never input: ≤ 90 short, 91–180 medium, > 180 long (BR-M03-C11)
  jsonb_build_array(case when (c ->> 'durationMin')::integer <= 90 then 'TIME_NGAN'
                         when (c ->> 'durationMin')::integer <= 180 then 'TIME_VUA' else 'TIME_DAI' end) as time_tags,
  coalesce(c -> 'groupTags', '[]'::jsonb) as group_tags,
  coalesce(c -> 'experienceTags', '[]'::jsonb) as experience_tags,
  -- derived from the active snapshot (BR-M03-T08)
  jsonb_array_length(s.checkpoints) as checkpoint_count,
  exists (select 1 from jsonb_array_elements(s.checkpoints) k where k ->> 'connectivityMode' = 'OFFLINE_REQUIRED')
    as has_offline_required_checkpoint,
  s.offline_route_map is not null as has_offline_route_map,
  coalesce((
    select jsonb_agg(jsonb_build_object('checkpointId', k -> 'checkpointId', 'sequence', k -> 'sequence',
                                        'checkpointName', k -> 'checkpointName') order by (k ->> 'sequence')::integer)
    from jsonb_array_elements(s.checkpoints) k), '[]'::jsonb) as checkpoint_summaries,
  r.active_content_version
from app.routes r
join app.revisions v on v.subject_type = 'ROUTE' and v.subject_id = r.route_id and v.status = 'PHAT_HANH'
join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version
cross join lateral (select v.content as c) content
-- bilingual values present in both languages after trim (an optional one is published only when complete)
cross join lateral (
  select coalesce(jsonb_object_agg(f.key, jsonb_build_object('vi', btrim(content.c -> f.key ->> 'vi', E' \t\r\n'),
                                                             'en', btrim(content.c -> f.key ->> 'en', E' \t\r\n'))), '{}'::jsonb) as complete
  from unnest(array['name', 'shortDescription', 'description', 'startingPoint', 'participationRequirements', 'preparation',
                    'bestTime', 'safetyWarning', 'routeMapCaption']) as f(key)
  where nullif(btrim(content.c -> f.key ->> 'vi', E' \t\r\n'), '') is not null
    and nullif(btrim(content.c -> f.key ->> 'en', E' \t\r\n'), '') is not null) t
left join app.media thumb on thumb.media_id::text = content.c ->> 'thumbnailMediaId'
left join app.media map on map.media_id::text = content.c ->> 'routeMapMediaId'
where r.status in ('HOAT_DONG', 'TAM_DONG', 'LUU_TRU');

-- Only each route's active version; historical snapshots stay unexposed
create view api.active_journey_snapshots with (security_barrier = true) as
select
  s.route_id,
  s.content_version,
  s.status,
  s.published_at,
  s.previous_content_version,
  s.estimated_offline_size_bytes,
  s.offline_route_map,
  s.checkpoints
from app.routes r
join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version;

grant select on api.published_routes, api.active_journey_snapshots to anon, authenticated;
