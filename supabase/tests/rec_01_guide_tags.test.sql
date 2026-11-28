-- pgTAP — CHG-REC-2026-11-28-01 (spec-M03 v3.8): nhóm nhãn guideTags, GROUP_DI_THEO_DOAN thay GROUP_CAN_DE_DANG,
-- chỉ chặn Khó + Gia đình có trẻ nhỏ (BR-M03-C12), guideTags bắt buộc khi xuất bản, cột guide_tags của view công khai,
-- tên hiển thị và nhãn trường cho nhật ký.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.route(p_extra jsonb) returns jsonb language sql as $$
  select '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false}'::jsonb || p_extra $$;
create function pg_temp.problems(p_content jsonb) returns text[] language sql as $$
  select app.revision_content_problems('ROUTE', pg_temp.route(p_content)) $$;
create function pg_temp.save_keys(p_content jsonb) returns text[] language sql as $$
  select coalesce(array_agg(i ->> 'messageKey' order by n), '{}')
  from jsonb_array_elements(app.route_save_issues('RtTest0000000001', p_content)) with ordinality x(i, n) $$;
create function pg_temp.missing_guide(p_content jsonb) returns boolean language sql as $$
  select exists (select 1 from jsonb_array_elements(app.route_publish_issues('RtTest0000000001', p_content)) i
                 where i ->> 'targetFieldKey' = 'guideTags' and i ->> 'messageKey' = 'MSG-MISSING-FIELD') $$;

-- ---- content validation (DAC-M03-033–035, v3.8) -----------------------------------------------------------------
select is(pg_temp.problems('{"guideTags": ["GUIDE_CO_HUONG_DAN_VIEN", "GUIDE_TU_THAM_QUAN"]}'), '{}', 'guideTags is an allowed key with both values');
select is(pg_temp.problems('{"guideTags": ["GUIDE_KHAC"]}'), '{guideTags}', 'guideTags enum');
select is(pg_temp.problems('{"guideTags": ["GUIDE_TU_THAM_QUAN", "GUIDE_TU_THAM_QUAN"]}'), '{guideTags}', 'guideTags values are distinct');
select is(pg_temp.problems('{"groupTags": ["GROUP_DI_THEO_DOAN"]}'), '{}', 'GROUP_DI_THEO_DOAN is allowed');
select is(pg_temp.problems('{"groupTags": ["GROUP_CAN_DE_DANG"]}'), '{groupTags}', 'GROUP_CAN_DE_DANG is retired');
select is(pg_temp.problems('{"difficulty": "KHO", "groupTags": ["GROUP_DI_THEO_DOAN"]}'), '{}', 'KHO with the tour-group tag is fine');
select is(pg_temp.problems('{"difficulty": "KHO", "groupTags": ["GROUP_GIA_DINH_CO_TRE"]}'), '{groupTags}', 'KHO with the family tag stays blocked');

-- ---- save issues (BR-M03-C12 message) ---------------------------------------------------------------------------
select is(pg_temp.save_keys('{"difficulty": "KHO", "groupTags": ["GROUP_DI_THEO_DOAN"]}'), '{}', 'save: KHO + Đi theo đoàn gives no conflict');
select is(pg_temp.save_keys('{"difficulty": "KHO", "groupTags": ["GROUP_GIA_DINH_CO_TRE"]}'), '{MSG-TAG-CONFLICT}', 'save: KHO + Gia đình có trẻ nhỏ is a conflict');

-- ---- publish gaps: guideTags required ---------------------------------------------------------------------------
select ok(pg_temp.missing_guide('{}'), 'publish: missing guideTags is reported');
select ok(pg_temp.missing_guide('{"guideTags": []}'), 'publish: empty guideTags is reported');
select ok(not pg_temp.missing_guide('{"guideTags": ["GUIDE_CO_HUONG_DAN_VIEN"]}'), 'publish: one guide value is enough');

-- ---- normalisation, names, labels, public view ------------------------------------------------------------------
select is(app.normalize_route_content('{"guideTags": ["GUIDE_TU_THAM_QUAN", "GUIDE_TU_THAM_QUAN"]}') -> 'guideTags',
  '["GUIDE_TU_THAM_QUAN"]'::jsonb, 'normalisation removes duplicate guide values');
select is(array[app.display_name('guideTag', 'GUIDE_CO_HUONG_DAN_VIEN'), app.display_name('guideTag', 'GUIDE_TU_THAM_QUAN'),
                app.display_name('groupTag', 'GROUP_DI_THEO_DOAN')],
  array['Đi cùng hướng dẫn viên', 'Tự tham quan được', 'Đi theo đoàn'], 'display names (spec-M03 §5.1)');
select is(app.field_label('ROUTE', 'guideTags'), 'Hướng dẫn viên', 'field label');
select has_column('api', 'published_routes', 'guide_tags', 'public view exposes guide_tags');

select * from finish();
rollback;
