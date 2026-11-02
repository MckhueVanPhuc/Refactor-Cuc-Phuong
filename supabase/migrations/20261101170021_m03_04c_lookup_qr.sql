-- M03 migration 4c — live QR lookup for visitors (tasks M03 T190; live-qr-lookup-contract §1–§4, §6; Physical §7.1;
-- BR-M03-I01–I04, E01, E04, X04; SC-M03-012, 017, 023).
-- Read-only: STABLE, writes nothing, no audit, no visitor data. Only published content; never a draft. The six steps
-- of BR-M03-I02 run in order. A result that cannot be concluded raises an error: it is never returned as INVALID.

create function api.lookup_qr(p_qr_identifier text, p_route_id text default null) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_qr app.qr_codes;
  v_checkpoint app.checkpoints;
  v_route app.routes;
  v_checkpoint_content jsonb;
  v_qr_content jsonb;
  v_mode text;
  v_checkpoint_name jsonb;
  v_object_name jsonb;
  v_intro jsonb;
begin
  -- 1. the identifier matches exactly after trimming; an unknown or non-active visit point is INVALID
  select * into v_qr from app.qr_codes where qr_identifier = btrim(coalesce(p_qr_identifier, ''), E' \t\r\n');
  if v_qr.qr_identifier is null or v_qr.status <> 'HOAT_DONG' then
    return '{"outcome": "INVALID"}';
  end if;
  -- 2. a draft or archived checkpoint
  select * into v_checkpoint from app.checkpoints where checkpoint_id = v_qr.checkpoint_id;
  if v_checkpoint.status in ('NHAP', 'LUU_TRU') then
    return '{"outcome": "INVALID"}';
  end if;
  -- 3–4. the caller's route, when given; M03 does not check that it lists the checkpoint (BR-M03-I01)
  if p_route_id is not null then
    select * into v_route from app.routes where route_id = p_route_id;
    if v_route.route_id is null or v_route.status = 'NHAP' then
      return '{"outcome": "INVALID"}';
    end if;
    if v_route.status in ('TAM_DONG', 'LUU_TRU') then
      return '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "ROUTE"}';
    end if;
  end if;
  -- 5. a closed checkpoint
  if v_checkpoint.status = 'TAM_DONG' then
    return '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "CHECKPOINT"}';
  end if;

  -- 6. VALID with the published content of exactly this visit point (BR-M03-E01); no route data (I03)
  v_checkpoint_content := (app.published_of('CHECKPOINT', v_checkpoint.checkpoint_id)).content;
  v_qr_content := (app.published_of('QRCODE', v_qr.qr_identifier)).content;
  v_mode := v_checkpoint_content ->> 'connectivityMode';
  v_checkpoint_name := app.complete_bilingual(v_checkpoint_content -> 'checkpointName');
  v_object_name := app.complete_bilingual(v_qr_content -> 'objectName');
  v_intro := app.complete_bilingual(v_qr_content -> 'introductionText');
  if v_mode is null or v_checkpoint_name is null or v_object_name is null or v_intro is null then
    raise exception 'live lookup cannot be concluded' using errcode = 'data_exception';
  end if;
  return jsonb_build_object('outcome', 'VALID', 'content', jsonb_build_object(
    'qrIdentifier', v_qr.qr_identifier,
    'checkpointId', v_checkpoint.checkpoint_id,
    'checkpointName', v_checkpoint_name,
    'connectivityMode', v_mode,
    'objectName', v_object_name,
    'localizedContent', jsonb_build_object('vi', jsonb_build_object('introductionText', v_intro ->> 'vi'),
                                           'en', jsonb_build_object('introductionText', v_intro ->> 'en')),
    'staticImages', coalesce((
      select jsonb_agg(m.source_ref order by i.n)
      from jsonb_array_elements(coalesce(v_qr_content -> 'mediaItems', '[]')) with ordinality i(item, n)
      join app.media m on m.media_id::text = i.item ->> 'mediaId' and m.type = 'IMAGE'), '[]'),
    -- audio/video only for ONLINE_AVAILABLE (BR-M03-E04)
    'mediaResources', case when v_mode = 'OFFLINE_REQUIRED' then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('type', m.type, 'sourceRef', m.source_ref, 'spokenLanguage', m.spoken_language) order by i.n)
      from jsonb_array_elements(coalesce(v_qr_content -> 'mediaItems', '[]')) with ordinality i(item, n)
      join app.media m on m.media_id::text = i.item ->> 'mediaId' and m.type in ('AUDIO', 'VIDEO')), '[]') end));
end;
$$;

grant execute on function api.lookup_qr(text, text) to anon, authenticated;
