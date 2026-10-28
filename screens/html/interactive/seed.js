/* Dữ liệu mẫu cho bản demo tương tác M03. Đây là phần dữ liệu được commit lên repo;
   mỗi trình duyệt nạp bản sao này vào localStorage lần đầu (hoặc khi bấm "Đặt lại dữ liệu"). */
window.CPQ_SEED = function () {
  var DAY = 86400000, now = Date.now();
  function ago(d, h) { return new Date(now - d * DAY - (h || 0) * 3600000).toISOString(); }
  var QR_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var qrSeq = 0;
  function qrId() { qrSeq++; var s = 'QR'; var x = qrSeq * 7919 + 13; for (var i = 0; i < 14; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += QR_ALPHA[x % QR_ALPHA.length]; } return s; }
  var MGR = 'quanly@example.org', STF = 'bientap.vien@example.org';

  function cp(id, status, vi, en, mode, verified, note, pubAt) {
    var c = { nameVi: vi, nameEn: en, mode: mode, verified: !!verified, note: note || '' };
    return { id: id, status: status, pub: pubAt ? c : null, draft: pubAt ? null : c, closure: null, discarded: false, editedBy: STF, editedAt: ago(pubAt || 3), publishedAt: pubAt ? ago(pubAt) : null };
  }
  var checkpoints = [
    cp('cp_cong', 'HOAT_DONG', 'Cổng vườn quốc gia', 'National park gate', 'ONLINE', true, 'Cạnh quầy bán vé.', 40),
    cp('cp_cho', 'HOAT_DONG', 'Cây chò ngàn năm', 'Thousand-year-old Cho tree', 'OFFLINE', false, 'Cách cổng chính khoảng 2 km, bên trái đường mòn.', 40),
    cp('cp_suoi', 'HOAT_DONG', 'Suối Mơ', 'Mo Stream', 'ONLINE', true, '', 30),
    cp('cp_dong', 'HOAT_DONG', 'Động Người Xưa', 'Prehistoric Cave', 'ONLINE', true, '', 25),
    cp('cp_ban', 'NHAP', 'Bản làng ven suối', 'Village by the stream', 'ONLINE', false, '', 0),
    cp('cp_moong', 'TAM_DONG', 'Hang Con Moong', 'Con Moong Cave', 'ONLINE', true, '', 20),
    cp('cp_cu', 'LUU_TRU', 'Cổng vườn cũ', 'Old gate', 'ONLINE', true, '', 90)
  ];
  checkpoints[5].closure = { reason: 'Sạt lở đoạn đường vào hang.', at: ago(6), by: MGR };

  var qrs = [];
  function addQr(cpId, status, vi, en, iv, ie, d) {
    var c = { nameVi: vi, nameEn: en, introVi: iv, introEn: ie };
    qrs.push({ id: qrId(), checkpointId: cpId, status: status, label: '', reason: '', pub: status === 'NHAP' ? null : c, draft: status === 'NHAP' ? c : null, editedBy: STF, editedAt: ago(d || 5), publishedAt: status === 'NHAP' ? null : ago(d || 5) });
  }
  addQr('cp_cong', 'HOAT_DONG', 'Bảng chào mừng', 'Welcome board', 'Chào mừng bạn đến Vườn quốc gia Cúc Phương.', 'Welcome to Cuc Phuong National Park.', 40);
  addQr('cp_cho', 'HOAT_DONG', 'Mặt cắt gốc cây', 'Cross-section of the trunk', 'Các vòng tuổi ghi lại hàng trăm năm của khu rừng.', 'Growth rings record hundreds of years of the forest.', 40);
  addQr('cp_cho', 'HOAT_DONG', 'Rễ cây chò', 'Buttress roots', 'Rễ bạnh vè giúp cây đứng vững trên nền đất ẩm.', 'Buttress roots keep the tree upright on damp soil.', 40);
  addQr('cp_cho', 'NHAP', 'Điểm tham quan chưa đặt tên 3', '', '', '', 2);
  addQr('cp_suoi', 'HOAT_DONG', 'Dòng suối trong vắt', 'Clear stream', 'Nước suối bắt nguồn từ các mạch ngầm trong núi đá vôi.', 'The stream springs from underground veins in the limestone.', 30);
  for (var i = 1; i <= 20; i++) addQr('cp_dong', 'HOAT_DONG', 'Khu vực ' + i + ' trong động', 'Cave area ' + i, 'Giới thiệu khu vực ' + i + ' của hang động.', 'Introduction to cave area ' + i + '.', 25);
  addQr('cp_moong', 'HOAT_DONG', 'Cửa hang', 'Cave entrance', 'Cửa hang Con Moong.', 'Con Moong cave entrance.', 20);

  function rc(vi, en, short, km, min, diff, start, safety, noWarn, offMap, ids) {
    return { nameVi: vi, nameEn: en, short: short, distanceKm: km, durationMin: min, difficulty: diff, startVi: start, safetyVi: safety, noWarn: noWarn, offlineMap: offMap, checkpointIds: ids };
  }
  var r1v1 = rc('Tuyến Cây chò', 'Cho Tree Trail', 'Đi bộ qua rừng nguyên sinh tới cây chò ngàn năm.', 3.2, 120, 'TRUNG_BINH', 'Cổng vườn quốc gia', 'Đường mòn trơn khi mưa, hãy mang giày bám tốt.', false, true, ['cp_cong', 'cp_cho']);
  var r1v2 = JSON.parse(JSON.stringify(r1v1)); r1v2.durationMin = 110;
  var r1v3 = JSON.parse(JSON.stringify(r1v2)); r1v3.checkpointIds = ['cp_cong', 'cp_cho', 'cp_suoi'];
  var routes = [
    { id: 'rt_cho', status: 'HOAT_DONG', pub: r1v3, draft: null, version: 3, closure: null, discarded: false, editedBy: MGR, editedAt: ago(4), publishedAt: ago(4),
      snapshots: [{ v: 1, at: ago(40), by: MGR, why: 'Xuất bản lần đầu', content: r1v1 }, { v: 2, at: ago(26), by: STF, why: 'Xuất bản tuyến', content: r1v2 }, { v: 3, at: ago(4), by: MGR, why: 'Xuất bản tuyến', content: r1v3 }] },
    { id: 'rt_dong', status: 'TAM_DONG', pub: rc('Tuyến Động Người Xưa', 'Prehistoric Cave Trail', 'Khám phá hang động có dấu vết người tiền sử.', 1.8, 90, 'NHE', 'Bãi đỗ xe Động Người Xưa', 'Nền hang ẩm, hãy đi chậm.', false, false, ['cp_cong', 'cp_dong']), draft: null, version: 1,
      closure: { source: 'MANUAL', reason: 'Mưa lớn, đường mòn ngập.', at: ago(2), by: MGR }, discarded: false, editedBy: MGR, editedAt: ago(25), publishedAt: ago(25),
      snapshots: [{ v: 1, at: ago(25), by: MGR, why: 'Xuất bản lần đầu', content: null }] },
    { id: 'rt_suoi', status: 'HOAT_DONG', pub: rc('Tuyến ngắn Suối Mơ', 'Short Mo Stream Trail', 'Một vòng ngắn quanh suối, hợp cho gia đình có trẻ nhỏ.', 0.8, 30, 'NHE', 'Cổng vườn quốc gia', '', true, false, ['cp_suoi']), draft: null, version: 1, closure: null, discarded: false, editedBy: STF, editedAt: ago(10), publishedAt: ago(10),
      snapshots: [{ v: 1, at: ago(10), by: STF, why: 'Xuất bản lần đầu', content: null }] },
    { id: 'rt_ban', status: 'NHAP', pub: null, draft: rc('Tuyến Bản làng ven suối', 'Village Stream Trail', '', null, null, '', '', '', false, false, []), version: 0, closure: null, discarded: false, editedBy: STF, editedAt: ago(1), publishedAt: null, snapshots: [] },
    { id: 'rt_cu', status: 'LUU_TRU', pub: rc('Tuyến thử nghiệm 2025', 'Test trail 2025', '', 1, 40, 'NHE', 'Cổng cũ', '', true, false, ['cp_cu']), draft: null, version: 1, closure: { source: 'MANUAL', reason: 'Tuyến thử.', at: ago(120), by: MGR }, discarded: false, editedBy: MGR, editedAt: ago(120), publishedAt: ago(130),
      snapshots: [{ v: 1, at: ago(130), by: MGR, why: 'Xuất bản lần đầu', content: null }] }
  ];
  routes.forEach(function (r) { r.snapshots.forEach(function (s) { if (!s.content) s.content = JSON.parse(JSON.stringify(r.pub)); }); });

  var accounts = [
    { email: MGR, role: 'REVIEWER', status: 'ACTIVE', pw: 'demo1234' },
    { email: STF, role: 'CONTENT_STAFF', status: 'ACTIVE', pw: 'demo1234' },
    { email: 'nhanvien.cho@example.org', role: 'CONTENT_STAFF', status: 'INVITATION_PENDING', pw: '' },
    { email: 'cuhoc.cu@example.org', role: 'CONTENT_STAFF', status: 'DEACTIVATED', pw: 'demo1234' }
  ];

  /* Phiên chơi mẫu để báo cáo có số liệu (sinh cố định, không dùng dữ liệu thật). */
  var sessions = [], x = 42;
  function rnd() { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }
  var plan = [
    { r: 'rt_cho', cps: [['cp_cong', 1, 'Cổng vườn quốc gia'], ['cp_cho', 2, 'Cây chò ngàn năm'], ['cp_suoi', 3, 'Suối Mơ']] },
    { r: 'rt_dong', cps: [['cp_cong', 1, 'Cổng vườn quốc gia'], ['cp_dong', 2, 'Động Người Xưa']] },
    { r: 'rt_suoi', cps: [['cp_suoi', 1, 'Suối Mơ']] }
  ];
  for (var n = 0; n < 60; n++) {
    var p = plan[rnd() < 0.6 ? 0 : (rnd() < 0.55 ? 1 : 2)];
    var done = rnd() < 0.72, k = done ? p.cps.length : 1 + Math.floor(rnd() * Math.max(1, p.cps.length - 1));
    var end = now - Math.floor(rnd() * 38 * DAY) - Math.floor(rnd() * 8) * 3600000;
    sessions.push({ id: 'ss_' + n, routeId: p.r, status: done ? 'HOAN_TAT' : 'BO_DO', endedAt: new Date(end).toISOString(), visited: p.cps.slice(0, k).map(function (c) { return { checkpointId: c[0], sequence: c[1], name: c[2] }; }) });
  }

  return {
    v: 1, me: null, seq: 100,
    accounts: accounts, routes: routes, checkpoints: checkpoints, qrs: qrs, sessions: sessions,
    lastIngestionAt: new Date(now - 3600000).toISOString(),
    audit: [
      { id: 'au_1', at: ago(4), actor: MGR, action: 'Xuất bản', kind: 'route', entityId: 'rt_cho', entityName: 'Tuyến Cây chò', before: 'Bản 2 đang hiển thị', after: 'Bản 3 đang hiển thị', outcome: 'OK', reason: '', selfPublished: false, affected: [] },
      { id: 'au_2', at: ago(2), actor: MGR, action: 'Đóng tạm', kind: 'route', entityId: 'rt_dong', entityName: 'Tuyến Động Người Xưa', before: 'Đang hoạt động', after: 'Tạm đóng', outcome: 'OK', reason: 'Mưa lớn, đường mòn ngập.', selfPublished: false, affected: [] }
    ]
  };
};
