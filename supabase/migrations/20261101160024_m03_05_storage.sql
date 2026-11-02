-- M03 migration 5 — Storage bucket `quest-media` and its policies (tasks M03 T172; Physical Schema §9;
-- media-storage-contract §1, §4; research R-11, R-12; constitution IV, V).
-- Objects live under uploads/{ownerType}/{ownerId}/{uploadKey}; no client may overwrite or delete an object.

-- No MIME list on the bucket: register_media checks `metadata.mimetype` and answers MSG-FILE-TYPE (media-storage §1
-- step 4); a bucket-level refusal would surface as an upload failure instead (validation-report D-126)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'quest-media', 'quest-media', false,
  -- the largest per-type limit (VIDEO_MAX_MB); the exact limit per type is checked by register_media (C-04)
  30 * 1048576
)
on conflict (id) do nothing;

-- An object is public when a media row with that path is used by a published revision or by any snapshot
-- (snapshots are retained, BR-M03-G08). Draft-only objects stay private to administrators (BR-M03-E14, F12).
create function app.media_object_is_public(p_object_name text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.media m
    where m.source_ref = p_object_name
      and exists (
        select 1 from app.revisions r
        where r.status = 'PHAT_HANH'
          and r.subject_type in ('ROUTE', 'QRCODE')
          and jsonb_path_exists(r.content, '$.** ? (@ == $id)', jsonb_build_object('id', m.media_id::text))
      )
  )
  or exists (
    select 1 from app.journey_snapshots s
    where s.offline_route_map ->> 'sourceRef' = p_object_name
      or jsonb_path_exists(s.checkpoints, '$[*].offlineResources[*].staticImages[*] ? (@ == $path)',
                           jsonb_build_object('path', p_object_name))
  )
$$;

revoke execute on function app.media_object_is_public(text) from public;
grant execute on function app.media_object_is_public(text) to anon, authenticated;

-- An active administrator uploads new objects under uploads/ (upsert is refused: there is no UPDATE policy)
create policy quest_media_admin_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'quest-media'
    and name like 'uploads/%'
    and (app.current_admin()).email is not null
  );

-- An active administrator reads (and signs URLs for) any object, so the editor shows just-uploaded files and
-- the visitor preview of a draft works (R-12); this opens nothing to visitors
create policy quest_media_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'quest-media' and (app.current_admin()).email is not null);

-- Everyone reads (and signs URLs for) published or snapshot-retained objects only
create policy quest_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'quest-media' and app.media_object_is_public(name));

-- No UPDATE or DELETE policy: client overwrite and delete are impossible (media-storage §4)
