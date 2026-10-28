/* Kho dữ liệu giả + quy tắc nghiệp vụ rút gọn cho bản demo tương tác M03.
   Chỉ dùng để thử luồng; KHÔNG phải code ứng dụng. Dữ liệu nằm trong localStorage của trình duyệt. */
(function () {
  var KEY = 'cpq-m03-demo-v1';
  var S;
  var LIMIT_QR = 20, LIMIT_CP = 30, OFFLINE_MB = 50, MB_PER_QR = 5, MB_MAP = 2;

  var LABEL = {
    status: { NHAP: 'Nháp', HOAT_DONG: 'Đang hoạt động', TAM_DONG: 'Tạm đóng', LUU_TRU: 'Đã lưu trữ', THU_HOI: 'Đã thu hồi' },
    role: { REVIEWER: 'Quản lý', CONTENT_STAFF: 'Nhân viên nội dung' },
    acct: { ACTIVE: 'Đang hoạt động', INVITATION_PENDING: 'Chờ nhận lời mời', DEACTIVATED: 'Đã khóa' },
    mode: { ONLINE: 'Dùng được khi có mạng', OFFLINE: 'Cần tải trước' },
    diff: { NHE: 'Nhẹ', TRUNG_BINH: 'Trung bình', KHO: 'Khó' }
  };
  var MSG = {
    noPerm: 'Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.',
    lastReviewer: 'Đây là quản lý đang hoạt động cuối cùng nên không thể khóa hoặc hạ quyền. Hãy mời thêm một quản lý trước.',
    limitQr: 'Mỗi điểm dừng chỉ có tối đa ' + LIMIT_QR + ' điểm tham quan chưa thu hồi.',
    limitCp: 'Một tuyến chỉ có tối đa ' + LIMIT_CP + ' điểm dừng (tính cả điểm dừng đã đóng).',
    dupCp: 'Điểm dừng này đã có trong tuyến.',
    nameTaken: 'Tên tiếng Việt này đã có ở điểm dừng khác. Hãy đặt tên khác.',
    reason: 'Hãy nhập lý do (tối đa 300 ký tự).'
  };

  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function iso() { return new Date().toISOString(); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } }
  function load() { try { var r = localStorage.getItem(KEY); if (r) { var d = JSON.parse(r); if (d && d.v === 1) return d; } } catch (e) { /* bỏ qua */ } return null; }
  S = load() || window.CPQ_SEED();
  persist();

  function uid(p) { S.seq++; return p + '_' + Date.now().toString(36) + S.seq; }
  function qrCode() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = 'QR'; for (var i = 0; i < 14; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

  var by = {
    route: function (id) { return S.routes.filter(function (r) { return r.id === id; })[0]; },
    cp: function (id) { return S.checkpoints.filter(function (c) { return c.id === id; })[0]; },
    qr: function (id) { return S.qrs.filter(function (q) { return q.id === id; })[0]; },
    acct: function (e) { e = String(e || '').trim().toLowerCase(); return S.accounts.filter(function (a) { return a.email === e; })[0]; }
  };
  function ent(kind, id) { return by[kind](id); }
  function cur(e) { return e.draft || e.pub; }
  function name(kind, e) {
    var c = cur(e) || {};
    if (kind === 'route') return c.nameVi || 'Tuyến chưa đặt tên';
    if (kind === 'cp') return c.nameVi || 'Điểm dừng chưa đặt tên';
    return c.nameVi || 'Điểm tham quan chưa đặt tên';
  }
  function me() { return S.me ? by.acct(S.me) : null; }
  function isReviewer() { var m = me(); return !!m && m.role === 'REVIEWER'; }
  function qrsOf(cpId) { return S.qrs.filter(function (q) { return q.checkpointId === cpId; }); }
  function liveQrCount(cpId) { return qrsOf(cpId).filter(function (q) { return q.status !== 'THU_HOI' && !q.discarded; }).length; }
  function ok(extra) { var o = { ok: true }; for (var k in extra) o[k] = extra[k]; return o; }
  function fail(msg, title) { return { ok: false, msg: msg, title: title || 'Chưa thực hiện được' }; }

  function audit(kind, e, action, before, after, outcome, reason, extra) {
    extra = extra || {};
    S.audit.unshift({ id: uid('au'), at: iso(), actor: S.me || '', action: action, kind: kind, entityId: e ? e.id : '', entityName: e ? name(kind, e) : (extra.entityName || ''),
      before: before || '', after: after || '', outcome: outcome || 'OK', reason: reason || '', selfPublished: !!extra.selfPublished, affected: extra.affected || [] });
  }
  function need(reviewer) {
    if (!me()) return fail('Hãy đăng nhập lại.', 'Hết phiên');
    if (reviewer && !isReviewer()) return fail(MSG.noPerm, 'Không đủ quyền');
    return null;
  }
  function reasonBad(r) { r = String(r || '').trim(); return !r || r.length > 300; }

  /* ---------- Tuyến: tính toán phụ trợ ---------- */
  function routesListing(cpId) {
    return S.routes.filter(function (r) {
      if (r.status === 'LUU_TRU') return false;
      var c = cur(r); var ids = (c && c.checkpointIds) || [];
      var pids = (r.pub && r.pub.checkpointIds) || [];
      return ids.indexOf(cpId) >= 0 || pids.indexOf(cpId) >= 0;
    });
  }
  function activeCpIds(r) {
    return ((r.pub && r.pub.checkpointIds) || []).filter(function (id) { var c = by.cp(id); return c && c.status === 'HOAT_DONG'; });
  }
  function sizeMb(r, content) {
    var c = content || r.pub; if (!c) return 0;
    var mb = c.offlineMap ? MB_MAP : 0;
    (c.checkpointIds || []).forEach(function (id) {
      var cp = by.cp(id); if (!cp || cp.status !== 'HOAT_DONG') return;
      var pc = cp.pub || cp.draft; if (!pc || pc.mode !== 'OFFLINE') return;
      mb += qrsOf(id).filter(function (q) { return q.status === 'HOAT_DONG'; }).length * MB_PER_QR;
    });
    return mb;
  }
  function snapshot(r, why) {
    r.version = (r.version || 0) + 1;
    r.snapshots.push({ v: r.version, at: iso(), by: S.me || '', why: why, content: clone(r.pub) });
  }
  /* Mọi tuyến đang xuất bản có điểm dừng này nhận snapshot mới khi hành trình đổi. */
  function resnapRoutesOf(cpId, why) {
    var out = [];
    S.routes.forEach(function (r) {
      if (r.status === 'LUU_TRU' || !r.pub || (r.pub.checkpointIds || []).indexOf(cpId) < 0) return;
      snapshot(r, why); out.push(r);
    });
    return out;
  }
  /* Quy tắc: tuyến không còn điểm dừng hoạt động thì tự đóng; không bao giờ tự mở lại. */
  function autoClose() {
    var closed = [];
    S.routes.forEach(function (r) {
      if (r.status !== 'HOAT_DONG' || !r.pub) return;
      if (activeCpIds(r).length === 0) {
        r.status = 'TAM_DONG';
        r.closure = { source: 'AUTO_NO_ACTIVE_CHECKPOINT', reason: 'Tuyến không còn điểm dừng nào đang hoạt động.', at: iso(), by: S.me || '' };
        closed.push(r);
        audit('route', r, 'Tự đóng tạm', 'Đang hoạt động', 'Tạm đóng', 'OK', r.closure.reason);
      }
    });
    return closed;
  }

  /* ---------- Số liệu nhập thủ công ---------- */
  function numErr(v, max, decimals, intOnly) {
    if (v === '' || v == null) return null;
    var s = String(v).replace(',', '.').trim(), n = Number(s);
    if (!isFinite(n) || n <= 0) return 'Hãy nhập số lớn hơn 0.';
    if (n > max) return 'Số quá lớn, tối đa ' + String(max).replace('.', ',') + '.';
    if (intOnly && Math.floor(n) !== n) return 'Hãy nhập số nguyên.';
    if (!intOnly && /\.\d{2,}/.test(s)) return 'Chỉ được tối đa ' + decimals + ' chữ số sau dấu phẩy.';
    return null;
  }

  var api = {
    LABEL: LABEL, MSG: MSG, LIMIT_QR: LIMIT_QR, LIMIT_CP: LIMIT_CP, OFFLINE_MB: OFFLINE_MB,
    state: function () { return S; }, by: by, ent: ent, cur: cur, name: name, me: me, isReviewer: isReviewer,
    qrsOf: qrsOf, liveQrCount: liveQrCount, routesListing: routesListing, activeCpIds: activeCpIds, sizeMb: sizeMb,
    save: persist,
    reset: function () { S = window.CPQ_SEED(); persist(); },
    exportJson: function () { return JSON.stringify(S, null, 2); },
    importJson: function (txt) {
      var d; try { d = JSON.parse(txt); } catch (e) { return fail('Tệp không đọc được.'); }
      if (!d || d.v !== 1 || !d.routes || !d.checkpoints || !d.qrs || !d.accounts) return fail('Tệp không đúng định dạng dữ liệu demo.');
      S = d; persist(); return ok({});
    },
    qrShort: function (id) { return 'Mã …' + String(id).slice(-6); },

    /* ----- Đăng nhập / tài khoản ----- */
    login: function (email, pw) {
      var a = by.acct(email);
      if (!String(email).trim() || !pw) return fail('Hãy nhập email và mật khẩu.', 'Thiếu thông tin');
      if (!a || a.pw !== pw) return { ok: false, kind: 'credential' };
      if (a.status !== 'ACTIVE') return { ok: false, kind: 'denied' };
      S.me = a.email; persist(); return ok({});
    },
    logout: function () { S.me = null; persist(); },
    invite: function (email, role) {
      var n = need(true); if (n) return n;
      email = String(email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, field: 'email', msg: 'Email chưa đúng. Hãy kiểm tra lại.' };
      if (by.acct(email)) return { ok: false, field: 'email', msg: 'Email ' + email + ' đã có tài khoản. Nếu tài khoản đang chờ nhận lời mời, hãy bấm Gửi lại lời mời.' };
      S.accounts.push({ email: email, role: role, status: 'INVITATION_PENDING', pw: '' });
      audit('acct', null, 'Gửi lời mời', '', 'Chờ nhận lời mời · ' + LABEL.role[role], 'OK', '', { entityName: email });
      persist(); return ok({ email: email });
    },
    resend: function (email) {
      var n = need(true); if (n) return n;
      var a = by.acct(email); if (!a || a.status !== 'INVITATION_PENDING') return fail('Chỉ gửi lại được cho tài khoản đang chờ nhận lời mời.');
      audit('acct', null, 'Gửi lại lời mời', 'Chờ nhận lời mời', 'Chờ nhận lời mời', 'OK', '', { entityName: a.email });
      persist(); return ok({ email: a.email });
    },
    setRole: function (email, role) {
      var n = need(true); if (n) return n;
      var a = by.acct(email), old = a.role; if (old === role) return ok({});
      var cnt = S.accounts.filter(function (x) { return x.role === 'REVIEWER' && x.status === 'ACTIVE'; }).length;
      if (old === 'REVIEWER' && a.status === 'ACTIVE' && role !== 'REVIEWER' && cnt <= 1) {
        audit('acct', null, 'Đổi vai trò', LABEL.role[old], LABEL.role[role], 'FAIL', MSG.lastReviewer, { entityName: a.email });
        persist(); return fail(MSG.lastReviewer, 'Không thực hiện được');
      }
      a.role = role; audit('acct', null, 'Đổi vai trò', LABEL.role[old], LABEL.role[role], 'OK', '', { entityName: a.email });
      persist(); return ok({});
    },
    setLocked: function (email, locked) {
      var n = need(true); if (n) return n;
      var a = by.acct(email);
      if (locked) {
        var cnt = S.accounts.filter(function (x) { return x.role === 'REVIEWER' && x.status === 'ACTIVE'; }).length;
        if (a.role === 'REVIEWER' && a.status === 'ACTIVE' && cnt <= 1) {
          audit('acct', null, 'Khóa tài khoản', 'Đang hoạt động', 'Đã khóa', 'FAIL', MSG.lastReviewer, { entityName: a.email });
          persist(); return fail(MSG.lastReviewer, 'Không thực hiện được');
        }
        audit('acct', null, 'Khóa tài khoản', LABEL.acct[a.status], 'Đã khóa', 'OK', '', { entityName: a.email }); a.status = 'DEACTIVATED';
      } else {
        a.status = a.pw ? 'ACTIVE' : 'INVITATION_PENDING';
        audit('acct', null, 'Mở khóa tài khoản', 'Đã khóa', LABEL.acct[a.status], 'OK', '', { entityName: a.email });
      }
      persist(); return ok({});
    },
    acceptInvite: function (email, pw1, pw2) {
      var a = by.acct(email);
      if (!a || a.status !== 'INVITATION_PENDING') return { ok: false, kind: 'link' };
      if (pw1 !== pw2) return { ok: false, kind: 'mismatch' };
      if (String(pw1).length < 8) return { ok: false, kind: 'rejected' };
      a.pw = pw1; a.status = 'ACTIVE'; audit('acct', null, 'Nhận lời mời', 'Chờ nhận lời mời', 'Đang hoạt động', 'OK', '', { entityName: a.email });
      persist(); return ok({});
    },
    resetPassword: function (email, pw1, pw2) {
      var a = by.acct(email);
      if (!a) return { ok: false, kind: 'link' };
      if (pw1 !== pw2) return { ok: false, kind: 'mismatch' };
      if (String(pw1).length < 8) return { ok: false, kind: 'rejected' };
      a.pw = pw1; persist(); return ok({}); /* tài khoản Đã khóa vẫn bị từ chối ở bước đăng nhập */
    },

    /* ----- Tạo mới ----- */
    createRoute: function () {
      var n = need(); if (n) return n;
      var r = { id: uid('rt'), status: 'NHAP', pub: null, draft: { nameVi: '', nameEn: '', short: '', distanceKm: null, durationMin: null, difficulty: '', startVi: '', safetyVi: '', noWarn: false, offlineMap: false, checkpointIds: [] },
        version: 0, closure: null, discarded: false, editedBy: S.me, editedAt: iso(), publishedAt: null, snapshots: [] };
      S.routes.push(r); audit('route', r, 'Tạo tuyến', '', 'Nháp', 'OK'); persist(); return ok({ id: r.id });
    },
    createCp: function () {
      var n = need(); if (n) return n;
      var c = { id: uid('cp'), status: 'NHAP', pub: null, draft: { nameVi: '', nameEn: '', mode: '', verified: false, note: '' }, closure: null, discarded: false, editedBy: S.me, editedAt: iso(), publishedAt: null };
      S.checkpoints.push(c); audit('cp', c, 'Tạo điểm dừng', '', 'Nháp', 'OK'); persist(); return ok({ id: c.id });
    },
    createQr: function (cpId) {
      var n = need(); if (n) return n;
      var cp = by.cp(cpId); if (!cp) return fail('Không tìm thấy điểm dừng.');
      if (cp.status === 'LUU_TRU') return fail('Điểm dừng đã lưu trữ, không thêm được điểm tham quan.');
      var c = cur(cp);
      if (!c.mode) return fail('Hãy lưu loại kết nối của điểm dừng trước khi thêm điểm tham quan.', 'Chưa thêm được');
      if (liveQrCount(cpId) >= LIMIT_QR) return fail(MSG.limitQr, 'Chưa thêm được');
      var q = { id: qrCode(), checkpointId: cpId, status: 'NHAP', label: '', reason: '', pub: null, draft: { nameVi: '', nameEn: '', introVi: '', introEn: '' }, discarded: false, editedBy: S.me, editedAt: iso(), publishedAt: null };
      S.qrs.push(q); audit('qr', q, 'Tạo điểm tham quan', '', 'Nháp', 'OK', '', { affected: [name('cp', cp)] }); persist(); return ok({ id: q.id });
    },

    /* ----- Lưu bản nháp ----- */
    saveRoute: function (id, w) {
      var n = need(); if (n) return n;
      var r = by.route(id); if (!r || r.status === 'LUU_TRU') return fail('Tuyến này không sửa được.');
      var errs = {};
      var e1 = numErr(w.distanceKm, 100, 1, false); if (e1) errs.distanceKm = e1;
      var e2 = numErr(w.durationMin, 1440, 0, true); if (e2) errs.durationMin = e2;
      if (String(w.nameVi || '').length > 100) errs.nameVi = 'Tối đa 100 ký tự.';
      if (w.checkpointIds.length > LIMIT_CP) errs.checkpointIds = MSG.limitCp;
      if (w.noWarn && String(w.safetyVi || '').trim()) w.noWarn = false; /* nhập cảnh báo thì đặt lại ô xác nhận */
      if (Object.keys(errs).length) return { ok: false, errors: errs };
      var c = clone(w);
      c.distanceKm = c.distanceKm === '' || c.distanceKm == null ? null : Number(String(c.distanceKm).replace(',', '.'));
      c.durationMin = c.durationMin === '' || c.durationMin == null ? null : Number(c.durationMin);
      r.draft = c; r.editedBy = S.me; r.editedAt = iso(); audit('route', r, 'Lưu bản nháp', '', 'Nháp', 'OK'); persist(); return ok({});
    },
    saveCp: function (id, w) {
      var n = need(); if (n) return n;
      var cp = by.cp(id); if (!cp || cp.status === 'LUU_TRU') return fail('Điểm dừng này không sửa được.');
      var errs = {}, vi = String(w.nameVi || '').trim().toLowerCase();
      if (vi && S.checkpoints.some(function (o) { return o.id !== id && o.status !== 'LUU_TRU' && [o.pub, o.draft].some(function (c) { return c && String(c.nameVi || '').trim().toLowerCase() === vi; }); })) errs.nameVi = MSG.nameTaken;
      if (String(w.nameVi || '').length > 100) errs.nameVi = 'Tối đa 100 ký tự.';
      if (String(w.nameEn || '').length > 100) errs.nameEn = 'Tối đa 100 ký tự.';
      if (String(w.note || '').length > 300) errs.note = 'Tối đa 300 ký tự.';
      if (Object.keys(errs).length) return { ok: false, errors: errs };
      var c = clone(w); if (c.mode !== 'ONLINE') c.verified = false;
      cp.draft = c; cp.editedBy = S.me; cp.editedAt = iso(); audit('cp', cp, 'Lưu bản nháp', '', 'Nháp', 'OK'); persist(); return ok({});
    },
    saveQr: function (id, w, label) {
      var n = need(); if (n) return n;
      var q = by.qr(id); if (!q || q.status === 'THU_HOI') return fail('Điểm tham quan này không sửa được.');
      var errs = {};
      if (String(w.nameVi || '').length > 100) errs.nameVi = 'Tối đa 100 ký tự.';
      if (String(label || '').length > 300) errs.label = 'Tối đa 300 ký tự.';
      if (Object.keys(errs).length) return { ok: false, errors: errs };
      q.draft = clone(w); q.label = label || ''; q.editedBy = S.me; q.editedAt = iso();
      audit('qr', q, 'Lưu bản nháp', '', 'Nháp', 'OK'); persist(); return ok({});
    },
    discardDraft: function (kind, id) {
      var n = need(); if (n) return n;
      var e = ent(kind, id); if (!e || !e.pub) return fail('Chưa có bản đã xuất bản để quay về.');
      e.draft = null; audit(kind, e, 'Bỏ thay đổi', 'Có bản nháp', 'Bản đang hiển thị', 'OK'); persist(); return ok({});
    },
    restoreRoute: function (id) {
      var n = need(); if (n) return n;
      var r = by.route(id);
      if (r.draft) return fail('Đang có bản nháp. Hãy xuất bản hoặc bỏ thay đổi trước, rồi mới khôi phục bản cũ.');
      if (r.snapshots.length < 2) return fail('Chưa có bản đã xuất bản trước đó.');
      var prev = r.snapshots[r.snapshots.length - 2];
      r.draft = clone(prev.content); r.editedBy = S.me; r.editedAt = iso();
      audit('route', r, 'Khôi phục bản cũ', 'Bản ' + r.version, 'Nháp từ bản ' + prev.v, 'OK'); persist(); return ok({ from: prev.v });
    },

    /* ----- Vòng đời tuyến ----- */
    closeRoute: function (id, reason) {
      var n = need(); if (n) return n; var r = by.route(id);
      if (r.status !== 'HOAT_DONG') return fail('Chỉ đóng tạm được tuyến đang hoạt động.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      r.status = 'TAM_DONG'; r.closure = { source: 'MANUAL', reason: reason.trim(), at: iso(), by: S.me };
      audit('route', r, 'Đóng tạm', 'Đang hoạt động', 'Tạm đóng', 'OK', reason.trim()); persist(); return ok({});
    },
    reopenRoute: function (id, note) {
      var n = need(true); if (n) return n; var r = by.route(id);
      if (r.status !== 'TAM_DONG') return fail('Chỉ mở lại được tuyến đang tạm đóng.');
      if (reasonBad(note)) return fail('Hãy nhập ghi chú xác nhận an toàn (tối đa 300 ký tự).', 'Thiếu ghi chú');
      if (!activeCpIds(r).length) { audit('route', r, 'Mở lại', 'Tạm đóng', 'Đang hoạt động', 'FAIL', 'Không còn điểm dừng hoạt động'); persist(); return fail('Tuyến chưa có điểm dừng nào đang hoạt động nên chưa mở lại được. Hãy mở lại điểm dừng trước.'); }
      r.status = 'HOAT_DONG'; r.closure = null; audit('route', r, 'Mở lại', 'Tạm đóng', 'Đang hoạt động', 'OK', note.trim()); persist(); return ok({});
    },
    archiveRoute: function (id, reason) {
      var n = need(true); if (n) return n; var r = by.route(id);
      if (r.status !== 'TAM_DONG') return fail('Chỉ lưu trữ được tuyến đang tạm đóng.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      r.status = 'LUU_TRU'; audit('route', r, 'Lưu trữ', 'Tạm đóng', 'Đã lưu trữ', 'OK', reason.trim()); persist(); return ok({});
    },
    discardRoute: function (id, reason) {
      var n = need(); if (n) return n; var r = by.route(id);
      if (r.pub || r.version) return fail('Chỉ hủy được tuyến chưa từng xuất bản.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      r.status = 'LUU_TRU'; r.discarded = true; audit('route', r, 'Hủy tuyến', 'Nháp', 'Đã hủy', 'OK', reason.trim()); persist(); return ok({});
    },

    /* ----- Vòng đời điểm dừng ----- */
    closeCpImpact: function (id) {
      var routes = routesListing(id), will = [];
      routes.forEach(function (r) {
        if (r.status !== 'HOAT_DONG') return;
        var act = activeCpIds(r); if (act.length === 1 && act[0] === id) will.push(r);
      });
      return { routes: routes, willClose: will };
    },
    closeCp: function (id, reason) {
      var n = need(); if (n) return n; var c = by.cp(id);
      if (c.status !== 'HOAT_DONG') return fail('Chỉ đóng tạm được điểm dừng đang hoạt động.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      var impacted = routesListing(id).map(function (r) { return name('route', r); });
      c.status = 'TAM_DONG'; c.closure = { reason: reason.trim(), at: iso(), by: S.me };
      resnapRoutesOf(id, 'Điểm dừng "' + name('cp', c) + '" đóng tạm');
      var closed = autoClose();
      audit('cp', c, 'Đóng tạm', 'Đang hoạt động', 'Tạm đóng', 'OK', reason.trim(), { affected: impacted });
      persist(); return ok({ autoClosed: closed.map(function (r) { return name('route', r); }) });
    },
    reopenCp: function (id, note) {
      var n = need(true); if (n) return n; var c = by.cp(id);
      if (c.status !== 'TAM_DONG') return fail('Chỉ mở lại được điểm dừng đang tạm đóng.');
      if (reasonBad(note)) return fail('Hãy nhập ghi chú xác nhận an toàn (tối đa 300 ký tự).', 'Thiếu ghi chú');
      var impacted = routesListing(id).map(function (r) { return name('route', r); });
      c.status = 'HOAT_DONG'; c.closure = null; resnapRoutesOf(id, 'Điểm dừng "' + name('cp', c) + '" mở lại');
      audit('cp', c, 'Mở lại', 'Tạm đóng', 'Đang hoạt động', 'OK', note.trim(), { affected: impacted });
      persist(); return ok({ note: 'Các tuyến đã tự đóng không tự mở lại; hãy mở lại từng tuyến.' });
    },
    archiveCp: function (id, reason) {
      var n = need(true); if (n) return n; var c = by.cp(id);
      if (c.status !== 'TAM_DONG') return fail('Chỉ lưu trữ được điểm dừng đang tạm đóng.');
      var using = routesListing(id);
      if (using.length) {
        var names = using.map(function (r) { return name('route', r); }).join(', ');
        audit('cp', c, 'Lưu trữ', 'Tạm đóng', 'Đã lưu trữ', 'FAIL', 'Còn tuyến đang dùng: ' + names, { affected: using.map(function (r) { return name('route', r); }) });
        persist(); return fail('Chưa thể lưu trữ điểm dừng này vì tuyến ' + names + ' vẫn có trong danh sách. Hãy bỏ điểm dừng khỏi các tuyến đó trước.', 'Chưa thể lưu trữ');
      }
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      c.status = 'LUU_TRU'; audit('cp', c, 'Lưu trữ', 'Tạm đóng', 'Đã lưu trữ', 'OK', reason.trim()); persist(); return ok({});
    },
    discardCp: function (id, reason) {
      var n = need(); if (n) return n; var c = by.cp(id);
      if (c.pub) return fail('Chỉ hủy được điểm dừng chưa từng xuất bản.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      c.status = 'LUU_TRU'; c.discarded = true; audit('cp', c, 'Hủy điểm dừng', 'Nháp', 'Đã hủy', 'OK', reason.trim()); persist(); return ok({});
    },

    /* ----- Điểm tham quan (QR) ----- */
    revokeQr: function (id, reason) {
      var n = need(); if (n) return n; var q = by.qr(id), cp = by.cp(q.checkpointId);
      if (q.status === 'THU_HOI') return fail('Mã này đã được thu hồi.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      if (q.status === 'HOAT_DONG' && cp.status === 'HOAT_DONG') {
        var others = qrsOf(cp.id).filter(function (x) { return x.id !== id && x.status === 'HOAT_DONG'; }).length;
        if (!others) {
          audit('qr', q, 'Thu hồi mã', 'Đang hoạt động', 'Đã thu hồi', 'FAIL', 'Không thu hồi được mã cuối của điểm dừng đang hoạt động', { affected: [name('cp', cp)] }); persist();
          return fail('Không thu hồi được mã cuối của điểm dừng đang hoạt động. Hãy đóng tạm điểm dừng hoặc thêm một mã khác trước.', 'Chưa thu hồi được');
        }
      }
      var was = q.status; q.status = 'THU_HOI'; q.reason = reason.trim();
      resnapRoutesOf(cp.id, 'Thu hồi một mã QR của "' + name('cp', cp) + '"');
      audit('qr', q, 'Thu hồi mã', LABEL.status[was], 'Đã thu hồi', 'OK', reason.trim(), { affected: [name('cp', cp)] }); persist(); return ok({});
    },
    discardQr: function (id, reason) {
      var n = need(); if (n) return n; var q = by.qr(id);
      if (q.pub) return fail('Chỉ hủy được điểm tham quan chưa từng xuất bản.');
      if (reasonBad(reason)) return fail(MSG.reason, 'Thiếu lý do');
      q.status = 'THU_HOI'; q.discarded = true; q.reason = reason.trim();
      audit('qr', q, 'Hủy điểm tham quan', 'Nháp', 'Đã hủy', 'OK', reason.trim(), { affected: [name('cp', by.cp(q.checkpointId))] }); persist(); return ok({});
    },

    /* ----- Xem lại và xuất bản ----- */
    review: function (kind, id) {
      var e = ent(kind, id); if (!e) return null;
      var d = e.draft, p = e.pub, issues = [], affected = [];
      if (!d) return { entity: e, noDraft: true, issues: [], affected: [], rows: [], needSafety: false };
      function need2(v, msg, f) { if (v == null || String(v).trim() === '') issues.push({ msg: msg, field: f }); }
      if (kind === 'route') {
        need2(d.nameVi, 'Tên tuyến (Tiếng Việt) còn trống.', 'nameVi'); need2(d.nameEn, 'Tên tuyến (English) còn trống.', 'nameEn');
        need2(d.short, 'Mô tả ngắn còn trống.', 'short'); need2(d.startVi, 'Điểm xuất phát còn trống.', 'startVi'); need2(d.difficulty, 'Chưa chọn độ khó.', 'difficulty');
        need2(d.distanceKm, 'Chưa nhập quãng đường.', 'distanceKm'); need2(d.durationMin, 'Chưa nhập thời lượng.', 'durationMin');
        if (!d.checkpointIds.length) issues.push({ msg: 'Tuyến cần ít nhất một điểm dừng.', field: 'checkpointIds' });
        else if (!d.checkpointIds.some(function (i) { var c = by.cp(i); return c && c.status === 'HOAT_DONG'; })) issues.push({ msg: 'Tuyến cần ít nhất một điểm dừng đang hoạt động.', field: 'checkpointIds' });
        affected = [e];
      } else if (kind === 'cp') {
        need2(d.nameVi, 'Tên điểm dừng (Tiếng Việt) còn trống.', 'nameVi'); need2(d.nameEn, 'Tên điểm dừng (English) còn trống.', 'nameEn'); need2(d.mode, 'Chưa chọn loại kết nối.', 'mode');
        if (d.mode === 'ONLINE' && !d.verified) issues.push({ msg: 'Điểm dừng dùng được khi có mạng cần tick "đã khảo sát thực địa".', field: 'verified' });
        if (!p && !qrsOf(id).some(function (q) { return q.status === 'HOAT_DONG'; })) issues.push({ msg: 'Điểm dừng cần ít nhất một điểm tham quan đã xuất bản trước khi hoạt động.', field: 'qr' });
        affected = routesListing(id);
      } else {
        need2(d.nameVi, 'Tên đối tượng (Tiếng Việt) còn trống.', 'nameVi'); need2(d.nameEn, 'Tên đối tượng (English) còn trống.', 'nameEn');
        need2(d.introVi, 'Giới thiệu (Tiếng Việt) còn trống.', 'introVi'); need2(d.introEn, 'Giới thiệu (English) còn trống.', 'introEn');
        affected = routesListing(e.checkpointId);
      }
      var needSafety = kind === 'route' && !String(d.safetyVi || '').trim() && !d.noWarn;
      if (kind === 'route' && !String(d.safetyVi || '').trim() && !d.noWarn) issues.push({ msg: 'Hãy nhập cảnh báo an toàn hoặc tick xác nhận tuyến không có cảnh báo.', field: 'safety', soft: true });
      /* dung lượng tải trước */
      var sizes = affected.map(function (r) {
        var content = kind === 'route' ? d : r.pub;
        return { route: r, mb: sizeMb(r, content) };
      });
      sizes.forEach(function (s) { if (s.mb > OFFLINE_MB) issues.push({ msg: 'Gói tải trước của tuyến "' + name('route', s.route) + '" sẽ nặng khoảng ' + s.mb + ' MB, vượt mức ' + OFFLINE_MB + ' MB. Hãy bớt điểm dừng cần tải trước hoặc bỏ sơ đồ offline.', field: 'size' }); });
      var rows = [];
      var FIELDS = {
        route: [['nameVi', 'Tên tuyến (Tiếng Việt)'], ['nameEn', 'Tên tuyến (English)'], ['short', 'Mô tả ngắn'], ['distanceKm', 'Quãng đường (km)'], ['durationMin', 'Thời lượng (phút)'], ['difficulty', 'Độ khó', 'diff'], ['startVi', 'Điểm xuất phát'], ['safetyVi', 'Cảnh báo an toàn', 0, 1], ['offlineMap', 'Sơ đồ dùng khi không có mạng', 'bool', 1], ['checkpointIds', 'Danh sách điểm dừng', 'cps']],
        cp: [['nameVi', 'Tên (Tiếng Việt)'], ['nameEn', 'Tên (English)'], ['mode', 'Loại kết nối', 'mode'], ['verified', 'Đã khảo sát thực địa', 'bool']],
        qr: [['nameVi', 'Tên đối tượng (Tiếng Việt)'], ['nameEn', 'Tên đối tượng (English)'], ['introVi', 'Giới thiệu (Tiếng Việt)'], ['introEn', 'Giới thiệu (English)']]
      }[kind];
      function fv(v, t) {
        if (v == null || v === '') return '(chưa có)';
        if (t === 'diff') return LABEL.diff[v] || v;
        if (t === 'mode') return LABEL.mode[v] || v;
        if (t === 'bool') return v ? 'Có' : 'Không';
        if (t === 'cps') return v.length ? v.map(function (i) { return name('cp', by.cp(i)); }).join(' → ') : '(chưa có)';
        return String(v);
      }
      FIELDS.forEach(function (f) {
        var a = p ? p[f[0]] : null, b = d[f[0]];
        if (JSON.stringify(a) === JSON.stringify(b)) return;
        rows.push({ label: f[1], oldV: p ? fv(a, f[2]) : '(chưa có)', newV: fv(b, f[2]), sens: !!f[3] });
      });
      return { entity: e, kind: kind, issues: issues, affected: affected, sizes: sizes, rows: rows, needSafety: needSafety, first: !p, noDraft: false };
    },
    tickNoWarn: function (id, v) { var r = by.route(id); if (!r.draft) return; r.draft.noWarn = !!v; persist(); },
    publish: function (kind, id) {
      var n = need(); if (n) return n;
      var rv = api.review(kind, id); if (!rv || rv.noDraft) return fail('Không có bản nháp để xuất bản.');
      var blocking = rv.issues.filter(function (i) { return true; });
      if (blocking.length) return fail('Còn mục chưa đạt. Hãy sửa rồi xuất bản lại.', 'Chưa xuất bản được');
      var e = rv.entity, self = e.editedBy === S.me, before, after;
      var affectedNames = rv.affected.map(function (r) { return name('route', r); });
      if (kind === 'route') {
        before = e.version ? 'Bản ' + e.version + ' đang hiển thị' : 'Chưa xuất bản';
        e.pub = e.draft; e.draft = null; e.publishedAt = iso();
        if (e.status === 'NHAP') e.status = 'HOAT_DONG';
        snapshot(e, e.version ? 'Xuất bản tuyến' : 'Xuất bản lần đầu'); after = 'Bản ' + e.version + ' đang hiển thị';
      } else if (kind === 'cp') {
        var first = !e.pub; before = first ? 'Chưa xuất bản' : 'Bản đang hiển thị';
        e.pub = e.draft; e.draft = null; e.publishedAt = iso();
        if (e.status === 'NHAP') e.status = 'HOAT_DONG';
        resnapRoutesOf(e.id, 'Xuất bản điểm dừng "' + e.pub.nameVi + '"'); after = 'Bản mới đang hiển thị';
      } else {
        before = e.pub ? 'Bản đang hiển thị' : 'Chưa xuất bản';
        e.pub = e.draft; e.draft = null; e.publishedAt = iso();
        if (e.status === 'NHAP') e.status = 'HOAT_DONG';
        resnapRoutesOf(e.checkpointId, 'Xuất bản điểm tham quan "' + e.pub.nameVi + '"'); after = 'Bản mới đang hiển thị';
      }
      audit(kind, e, 'Xuất bản', before, after, 'OK', '', { selfPublished: self, affected: kind === 'route' ? [] : affectedNames });
      persist(); return ok({ version: e.version, affected: affectedNames });
    },

    /* ----- Báo cáo ----- */
    report: function (fromMs, toMsExclusive, routeId) {
      var list = S.sessions.filter(function (s) { var t = Date.parse(s.endedAt); return t >= fromMs && t < toMsExclusive && (!routeId || s.routeId === routeId); });
      var done = list.filter(function (s) { return s.status === 'HOAN_TAT'; }).length;
      var map = {};
      list.slice().sort(function (a, b) { return Date.parse(a.endedAt) - Date.parse(b.endedAt); }).forEach(function (s) {
        s.visited.forEach(function (v) {
          var k = s.routeId + '|' + v.checkpointId; map[k] = map[k] || { routeId: s.routeId, checkpointId: v.checkpointId, name: v.name, sequence: v.sequence, ids: {} };
          map[k].name = v.name; map[k].sequence = v.sequence; map[k].ids[s.id] = 1;
        });
      });
      var rows = Object.keys(map).map(function (k) { var m = map[k]; return { routeId: m.routeId, checkpointId: m.checkpointId, name: m.name, sequence: m.sequence, count: Object.keys(m.ids).length }; });
      rows.sort(function (a, b) { return a.routeId < b.routeId ? -1 : a.routeId > b.routeId ? 1 : a.sequence - b.sequence; });
      return { total: list.length, done: done, abandoned: list.length - done, rows: rows };
    }
  };
  window.CPQ = api;
})();
