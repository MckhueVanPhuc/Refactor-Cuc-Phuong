/* Giao diện + luồng cho bản demo tương tác M03. Chỉ phục vụ thử nghiệm; không phải code ứng dụng. */
(function () {
  var C = window.CPQ, L = C.LABEL;
  var page = document.body.dataset.page;
  var root = document.getElementById('app');
  var W = null, dirty = false, view = { acts: {} };

  /* ---------- tiện ích ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(k) { var m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function vn(iso) { var d = new Date(Date.parse(iso) + 7 * 3600000); return { d: pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(), t: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) }; }
  function fmt(iso) { if (!iso) return ''; var p = vn(iso); return p.d + ' ' + p.t; }
  function chipCls(st) { return { HOAT_DONG: 'ok', TAM_DONG: 'warn', NHAP: 'draft', ACTIVE: 'ok', INVITATION_PENDING: 'info', DEACTIVATED: '' }[st] || ''; }
  function chip(st, text) { return '<span class="chip ' + chipCls(st) + '">' + esc(text || L.status[st] || L.acct[st] || st) + '</span>'; }
  function banner(kind, title, text, extra) { return '<div class="banner ' + kind + '" role="' + (kind === 'ok' || kind === 'info' ? 'status' : 'alert') + '"><span class="t">' + esc(title) + '</span><p>' + esc(text) + '</p>' + (extra || '') + '</div>'; }
  function err(id, m) { return m ? '<p class="err" id="' + id + '" role="alert">' + esc(m) + '</p>' : ''; }
  function setFlash(kind, title, text) { try { sessionStorage.setItem('cpq-flash', JSON.stringify({ kind: kind, title: title, text: text })); } catch (e) { /* bỏ qua */ } }
  function takeFlash() { try { var f = sessionStorage.getItem('cpq-flash'); sessionStorage.removeItem('cpq-flash'); return f ? JSON.parse(f) : null; } catch (e) { return null; } }
  var flash = takeFlash();
  function go(url) { dirty = false; location.href = url; }
  function leaveOk() { return !dirty || confirm('Còn thay đổi chưa lưu. Rời trang?'); }
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  function me() { return C.me(); }
  function rev() { return C.isReviewer(); }
  function eName(kind, e) { return C.name(kind, e); }

  /* ---------- hộp thoại ---------- */
  function modal(o) {
    return new Promise(function (resolve) {
      var back = document.createElement('div'); back.className = 'dialog-backdrop';
      var f = (o.fields || []).map(function (x) {
        if (x.type === 'select') return '<div class="field"><label for="m_' + x.id + '">' + esc(x.label) + '</label><select id="m_' + x.id + '">' + x.options.map(function (op) { return '<option value="' + esc(op[0]) + '"' + (op[0] === x.value ? ' selected' : '') + '>' + esc(op[1]) + '</option>'; }).join('') + '</select></div>';
        return '<div class="field"><label for="m_' + x.id + '">' + esc(x.label) + '</label><textarea id="m_' + x.id + '" maxlength="400"></textarea><span class="hint">' + esc(x.hint || 'Không để trống, tối đa 300 ký tự.') + '</span><p class="err" id="e_' + x.id + '" role="alert" hidden></p></div>';
      }).join('');
      back.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="m_t"><h2 id="m_t">' + esc(o.title) + '</h2>' + (o.html || '') + f +
        '<div class="actions"><button class="btn" type="button" data-m="no">' + esc(o.cancel || 'Quay lại') + '</button>' + (o.ok === false ? '' : '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-m="yes">' + esc(o.ok || 'Đồng ý') + '</button>') + '</div></div>';
      var prev = document.activeElement;
      function close(v) { document.removeEventListener('keydown', key); back.remove(); document.querySelectorAll('.m03-shell,.auth-wrap').forEach(function (e) { e.removeAttribute('inert'); }); if (prev && prev.focus) prev.focus(); resolve(v); }
      function key(e) { if (e.key === 'Escape') close(null); }
      back.addEventListener('click', function (e) {
        var b = e.target.closest('[data-m]'); if (!b) return;
        if (b.dataset.m === 'no') return close(null);
        var vals = {}, bad = false;
        (o.fields || []).forEach(function (x) {
          var el = back.querySelector('#m_' + x.id), v = el.value;
          if (x.type !== 'select') { var er = back.querySelector('#e_' + x.id), t = v.trim(); if (!t || t.length > 300) { er.textContent = 'Hãy nhập nội dung (tối đa 300 ký tự).'; er.hidden = false; el.setAttribute('aria-invalid', 'true'); bad = true; } else er.hidden = true; }
          vals[x.id] = v;
        });
        if (!bad) close(vals);
      });
      document.addEventListener('keydown', key);
      document.body.appendChild(back);
      document.querySelectorAll('.m03-shell,.auth-wrap').forEach(function (e) { e.setAttribute('inert', ''); });
      var first = back.querySelector('textarea,select,button'); if (first) first.focus();
    });
  }

  /* ---------- khung trang ---------- */
  var NAV = [['routes', 'Tuyến', 'routes.html'], ['checkpoints', 'Thư viện điểm dừng', 'checkpoints.html'], ['reports', 'Báo cáo', 'reports.html'], ['accounts', 'Tài khoản', 'accounts.html', 1], ['audit', 'Nhật ký hệ thống', 'audit.html', 1]];
  function demoBar(scr) {
    var m = me();
    return '<aside class="mock-bar" aria-label="Công cụ demo"><div class="row"><strong>Demo tương tác M03 · ' + esc(scr) + ' · dữ liệu minh họa lưu trong trình duyệt này</strong>' +
      '<button type="button" data-act="home">Trang demo</button>' +
      '<button type="button" data-act="as" data-email="quanly@example.org">Vào như Quản lý</button>' +
      '<button type="button" data-act="as" data-email="bientap.vien@example.org">Vào như Nhân viên</button>' +
      '<button type="button" data-act="reset">Đặt lại dữ liệu</button><button type="button" data-act="export">Xuất JSON</button><button type="button" data-act="import">Nhập JSON</button>' +
      '<input type="file" id="imp" accept="application/json" hidden></div></aside>';
  }
  function shell(title, scr, navKey, body) {
    var m = me(), staff = m && m.role !== 'REVIEWER';
    var nav = NAV.filter(function (n) { return !(n[3] && staff); }).map(function (n) { return '<li><a href="' + n[2] + '"' + (n[0] === navKey ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>'; }).join('');
    return demoBar(scr) + '<div class="m03-shell"><div class="m03-side"><div class="brand">Cúc Phương Quest · Quản trị</div><nav aria-label="Menu quản trị"><ul>' + nav + '</ul></nav></div>' +
      '<div class="m03-main"><header class="m03-top"><h1>' + esc(title) + '</h1><div class="row"><span class="small">' + esc(m.email) + ' · ' + esc(L.role[m.role]) + '</span><button class="btn" type="button" data-act="logout">Đăng xuất</button></div></header>' +
      '<main class="m03-body">' + (flash ? banner(flash.kind, flash.title, flash.text) : '') + body + '</main></div></div>';
  }
  function plain(scr, body) { return demoBar(scr) + '<div class="auth-wrap">' + body + '</div>'; }
  function mount(html) { root.innerHTML = html; flash = null; }
  var NOPERM = function () { return banner('err', 'Không đủ quyền', C.MSG.noPerm); };

  /* ---------- sự kiện chung ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act;
    if (a === 'home') { if (leaveOk()) go('index.html'); return; }
    if (a === 'as') { if (!leaveOk()) return; C.logout(); C.login(b.dataset.email, 'demo1234'); go('routes.html'); return; }
    if (a === 'reset') { if (confirm('Đặt lại toàn bộ dữ liệu demo về dữ liệu mẫu?')) { C.reset(); setFlash('ok', 'Đã đặt lại', 'Dữ liệu demo đã về dữ liệu mẫu. Hãy đăng nhập lại.'); go('login.html'); } return; }
    if (a === 'export') { var blob = new Blob([C.exportJson()], { type: 'application/json' }), u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'cpq-m03-demo.json'; l.click(); URL.revokeObjectURL(u); return; }
    if (a === 'import') { document.getElementById('imp').click(); return; }
    if (a === 'logout') { if (!leaveOk()) return; C.logout(); go('login.html'); return; }
    var h = view.acts[a]; if (h) { e.preventDefault(); h(b.dataset, b); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'imp' && e.target.files[0]) {
      var rd = new FileReader(); rd.onload = function () { var r = C.importJson(rd.result); if (r.ok) { setFlash('ok', 'Đã nhập dữ liệu', 'Dữ liệu demo đã được thay bằng tệp bạn chọn.'); go('index.html'); } else alert(r.msg); }; rd.readAsText(e.target.files[0]); return;
    }
    var t = e.target.closest('[data-bind]'); if (t && W) { W[t.dataset.bind] = t.type === 'checkbox' ? t.checked : t.value; dirty = true; if (t.hasAttribute('data-rerender') && view.render) view.render(); }
  });
  document.addEventListener('input', function (e) { var t = e.target.closest('[data-bind]'); if (t && W && t.type !== 'checkbox' && t.tagName !== 'SELECT') { W[t.dataset.bind] = t.value; dirty = true; } });

  function guard() {
    if (!me()) { go('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return false; }
    return true;
  }

  /* ================= INDEX ================= */
  function pIndex() {
    var m = me();
    mount(demoBar('Trang demo') + '<div class="auth-wrap" style="align-items:start"><main class="card stack" style="max-width:860px;width:100%"><h1 style="margin:0">Demo tương tác M03 — Quản trị vận hành & nội dung</h1>' +
      (flash ? banner(flash.kind, flash.title, flash.text) : '') +
      '<p>Bản demo dùng dữ liệu giả trong trình duyệt của bạn (localStorage), mô phỏng một số quy tắc nghiệp vụ chính để kiểm tra luồng giữa các màn. Không có máy chủ thật, không phải code ứng dụng.</p>' +
      (m ? banner('info', 'Đang đăng nhập', m.email + ' · ' + L.role[m.role]) : '') +
      '<h2 style="margin:0">Bắt đầu</h2><div class="row"><a class="btn btn-primary" href="login.html">Đăng nhập</a><button class="btn" type="button" data-act="as" data-email="quanly@example.org">Vào nhanh như Quản lý</button><button class="btn" type="button" data-act="as" data-email="bientap.vien@example.org">Vào nhanh như Nhân viên nội dung</button></div>' +
      '<h2 style="margin:0">Tài khoản demo (mật khẩu: demo1234)</h2><ul class="list-plain"><li><strong>quanly@example.org</strong> — Quản lý, đang hoạt động</li><li><strong>bientap.vien@example.org</strong> — Nhân viên nội dung, đang hoạt động</li><li>nhanvien.cho@example.org — chờ nhận lời mời (mở lời mời từ màn Tài khoản)</li><li>cuhoc.cu@example.org — đã khóa (đăng nhập sẽ bị từ chối)</li></ul>' +
      '<h2 style="margin:0">Kịch bản nên thử</h2><ol style="margin:0;padding-left:20px;display:grid;gap:8px">' +
      '<li><strong>Tuyến tự đóng:</strong> Thư viện điểm dừng → "Suối Mơ" → Đóng tạm. Hộp thoại báo "Tuyến ngắn Suối Mơ" sẽ tự đóng; sau đó mở lại điểm dừng thì tuyến vẫn không tự mở.</li>' +
      '<li><strong>Chặn khóa quản lý cuối:</strong> (Quản lý) Tài khoản → Khóa hoặc Đổi vai trò chính quản lý duy nhất → bị chặn. Mời thêm một quản lý, nhận lời mời rồi thử lại.</li>' +
      '<li><strong>Giới hạn 20 QR:</strong> Thư viện điểm dừng → "Động Người Xưa" đã có 20/20 → "Thêm điểm tham quan" bị chặn. Thu hồi một mã rồi thêm lại.</li>' +
      '<li><strong>Chặn lưu trữ khi còn tuyến dùng:</strong> Đóng tạm "Suối Mơ" rồi bấm Lưu trữ (Quản lý) → bị chặn vì tuyến còn liệt kê. Trong khi "Hang Con Moong" (tạm đóng, không tuyến nào dùng) lưu trữ được.</li>' +
      '<li><strong>Vai trò:</strong> Nhân viên không mở lại/lưu trữ được và không thấy Tài khoản, Nhật ký.</li>' +
      '<li><strong>Xuất bản tạo phiên bản mới:</strong> Mở "Tuyến Cây chò" → sửa → Xuất bản → xem Bản 4 trong lịch sử. Xuất bản điểm dừng/điểm tham quan cũng tạo bản mới cho mọi tuyến liên quan.</li></ol>' +
      '<h2 style="margin:0">Các màn</h2><ul class="list-plain"><li><a href="login.html">SCR-M03-000</a> Đăng nhập · <a href="accept.html?mode=recovery">SCR-M03-007</a> Lời mời & khôi phục</li><li><a href="routes.html">SCR-M03-001</a> Quản trị tuyến · SCR-M03-002 Biên tập tuyến</li><li><a href="checkpoints.html">SCR-M03-008</a> Thư viện điểm dừng · SCR-M03-003 Điểm tham quan · SCR-M03-004 Xem lại & xuất bản</li><li><a href="reports.html">SCR-M03-005</a> Báo cáo · <a href="accounts.html">SCR-M03-006</a> Tài khoản · <a href="audit.html">SCR-M03-009</a> Nhật ký</li></ul>' +
      '<p class="hint" style="margin:0">Phạm vi rút gọn: không có upload media thật, không phát hiện ghi cũ (stale write), không xem trước như du khách ở mọi màn. Dùng "Xuất JSON / Nhập JSON" để chia sẻ trạng thái giữa các người thử.</p></main></div>');
  }

  /* ================= 000 ĐĂNG NHẬP ================= */
  function pLogin() {
    var st = '';
    view.render = function () {
      var body = '<main class="card auth-card stack" style="max-width:440px;width:100%"><div><div class="small" style="font-weight:600">Cúc Phương Quest · Quản trị</div><h1 style="margin:0">Đăng nhập</h1></div>' +
        (flash ? banner(flash.kind, flash.title, flash.text) : '') +
        (st === 'credential' ? banner('err', 'Không đăng nhập được', 'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại.') : '') +
        (st === 'denied' ? banner('err', 'Không có quyền', 'Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý.') : '') +
        (st === 'empty' ? banner('err', 'Thiếu thông tin', 'Hãy nhập email và mật khẩu.') : '') +
        '<form class="stack" id="lf" novalidate><div class="field"><label for="em">Email</label><input id="em" type="text" inputmode="email" autocomplete="username" value="quanly@example.org"></div>' +
        '<div class="field"><label for="pw">Mật khẩu</label><input id="pw" type="password" autocomplete="current-password" value="demo1234"></div>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Đăng nhập</button><p style="margin:0"><a href="accept.html?mode=recovery">Quên mật khẩu</a></p></form>' +
        '<p class="hint" style="margin:0">Hệ thống chỉ dành cho tài khoản được quản lý mời. Mật khẩu demo: demo1234.</p></main>';
      mount(plain('SCR-M03-000', body));
      document.getElementById('lf').addEventListener('submit', function (e) {
        e.preventDefault();
        var r = C.login(document.getElementById('em').value, document.getElementById('pw').value);
        if (r.ok) go(qs('next') || 'routes.html'); else { st = r.kind || 'empty'; view.render(); }
      });
    };
    view.render();
  }

  /* ================= 007 LỜI MỜI / KHÔI PHỤC ================= */
  function pAccept() {
    var mode = qs('mode') || 'recovery', email = qs('email'), st = '', sentTo = '';
    view.render = function () {
      var ttl = mode === 'invite' ? 'Nhận lời mời' : mode === 'reset' ? 'Đặt mật khẩu mới' : 'Khôi phục mật khẩu';
      var a = C.by.acct(email), linkBad = (mode === 'invite' && (!a || a.status !== 'INVITATION_PENDING')) || (mode === 'reset' && !a);
      var b = '<main class="card stack" style="max-width:440px;width:100%"><div><div class="small" style="font-weight:600">Cúc Phương Quest · Quản trị</div><h1 style="margin:0">' + (linkBad ? 'Liên kết không dùng được' : ttl) + '</h1></div>';
      if (linkBad || st === 'link') b += banner('err', 'Liên kết không dùng được', 'Liên kết này không dùng được hoặc đã hết hạn. Nếu là lời mời, hãy nhờ quản lý gửi lại; nếu là khôi phục mật khẩu, hãy yêu cầu lại.');
      else if (mode === 'recovery') {
        if (sentTo !== '') b += banner('ok', 'Đã nhận yêu cầu', 'Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.') +
          (C.by.acct(sentTo) ? '<p class="hint" style="margin:0">Chỉ có trong demo (thay cho email thật): <a href="accept.html?mode=reset&email=' + encodeURIComponent(sentTo) + '">mở liên kết đặt lại mật khẩu</a>.</p>' : '');
        b += '<form class="stack" id="af" novalidate><div class="field"><label for="rem">Email của tài khoản</label><input id="rem" type="text" inputmode="email" value="' + esc(sentTo || 'quanly@example.org') + '"></div><button class="btn btn-primary btn-lg btn-block" type="submit">Gửi yêu cầu khôi phục</button></form>';
      } else {
        b += '<p class="small" style="margin:0">' + (mode === 'invite' ? 'Bạn được mời vào hệ thống quản trị với email <strong>' + esc(email) + '</strong>. Hãy đặt mật khẩu để kích hoạt tài khoản.' : 'Hãy đặt mật khẩu mới cho tài khoản <strong>' + esc(email) + '</strong>.') + '</p>' +
          '<form class="stack" id="af" novalidate><div class="field"><label for="p1">Mật khẩu</label><input id="p1" type="password" autocomplete="new-password"></div>' +
          '<div class="field"><label for="p2">Nhập lại mật khẩu</label><input id="p2" type="password" autocomplete="new-password"' + (st === 'mismatch' ? ' aria-invalid="true"' : '') + '>' + (st === 'mismatch' ? err('pe', 'Hai lần nhập mật khẩu chưa giống nhau. Hãy nhập lại.') : '') + '</div>' +
          (st === 'rejected' ? err('pr', 'Mật khẩu này chưa được chấp nhận. Hãy chọn mật khẩu khác dài hơn và khó đoán hơn.') : '') +
          '<button class="btn btn-primary btn-lg btn-block" type="submit">' + (mode === 'invite' ? 'Hoàn tất lời mời' : 'Đặt mật khẩu mới') + '</button><p class="hint" style="margin:0">Mật khẩu cần ít nhất 8 ký tự (quy tắc mô phỏng của nhà cung cấp xác thực).</p></form>';
      }
      b += '<p style="margin:0"><a href="login.html">Về đăng nhập</a></p></main>';
      mount(plain('SCR-M03-007', b));
      var f = document.getElementById('af'); if (!f) return;
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (mode === 'recovery') { sentTo = document.getElementById('rem').value.trim().toLowerCase(); view.render(); return; }
        var fn = mode === 'invite' ? C.acceptInvite : C.resetPassword, r = fn(email, document.getElementById('p1').value, document.getElementById('p2').value);
        if (r.ok) { setFlash('ok', mode === 'invite' ? 'Đã kích hoạt tài khoản' : 'Đã đổi mật khẩu', 'Hãy đăng nhập bằng mật khẩu vừa đặt.'); go('login.html'); } else { st = r.kind; view.render(); }
      });
    };
    view.render();
  }

  /* ================= 001 DANH SÁCH TUYẾN ================= */
  function pRoutes() {
    var q = '', f = '', sel = qs('h');
    function info(r) {
      var s = [];
      if (r.discarded) s.push('Đã hủy');
      else if (r.status === 'TAM_DONG' && r.closure) s.push((r.closure.source === 'MANUAL' ? 'Đóng thủ công' : 'Tự đóng') + ' · ' + r.closure.reason + ' · ' + fmt(r.closure.at));
      else if (r.status === 'LUU_TRU') s.push('Chỉ đọc');
      else if (!r.version) s.push('Chưa từng xuất bản');
      else s.push('Bản ' + r.version + ' đang hiển thị');
      return esc(s.join(' ')) + (r.draft && r.pub ? ' <span class="chip draft">Có bản nháp chưa xuất bản</span>' : '');
    }
    view.render = function () {
      var st = C.state(), isR = rev();
      var rows = st.routes.filter(function (r) {
        if (r.discarded && f !== 'LUU_TRU') return false;
        if (f && r.status !== f) return false;
        return !q || eName('route', r).toLowerCase().indexOf(q.toLowerCase()) >= 0;
      }).map(function (r) {
        var a = '<a class="btn" href="route-edit.html?id=' + r.id + '">Mở tuyến</a>';
        if (r.status === 'HOAT_DONG') a += '<button class="btn" type="button" data-act="close" data-id="' + r.id + '">Đóng tạm</button>';
        if (r.status === 'TAM_DONG') a += isR ? '<button class="btn" type="button" data-act="reopen" data-id="' + r.id + '">Mở lại</button><button class="btn btn-danger" type="button" data-act="archive" data-id="' + r.id + '">Lưu trữ</button>'
          : '<button class="btn" type="button" disabled aria-disabled="true">Mở lại (chỉ quản lý)</button><button class="btn btn-danger" type="button" disabled aria-disabled="true">Lưu trữ (chỉ quản lý)</button>';
        if (!r.pub && !r.version && r.status === 'NHAP') a += '<button class="btn btn-danger" type="button" data-act="discard" data-id="' + r.id + '">Hủy</button>';
        a += '<button class="btn" type="button" data-act="hist" data-id="' + r.id + '">Lịch sử</button>';
        return '<tr' + (sel === r.id ? ' aria-current="true"' : '') + '><th scope="row">' + esc(eName('route', r)) + '</th><td>' + chip(r.discarded ? 'LUU_TRU' : r.status, r.discarded ? 'Đã hủy' : '') + '</td><td>' + info(r) + '</td><td><div class="row-actions">' + a + '</div></td></tr>';
      }).join('') || '<tr><td colspan="4">Không có tuyến nào khớp.</td></tr>';
      var sr = sel && C.by.route(sel), hist = '';
      if (sr) {
        hist = '<section class="card stack-sm" aria-labelledby="hs-h"><h2 id="hs-h">Lịch sử của "' + esc(eName('route', sr)) + '"</h2>' +
          (sr.snapshots.length ? '<ul class="list-plain">' + sr.snapshots.slice().reverse().map(function (s) { return '<li><strong>Bản ' + s.v + '</strong> — ' + esc(s.why) + ' · ' + fmt(s.at) + ' · ' + esc(s.by) + (s.v === sr.version ? ' <span class="chip ok">Đang hiển thị</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p style="margin:0">Chưa có bản nào được xuất bản.</p>') +
          '<div class="row"><button class="btn" type="button" data-act="restore" data-id="' + sr.id + '"' + (sr.draft || sr.snapshots.length < 2 ? ' disabled aria-disabled="true"' : '') + '>Khôi phục bản đã xuất bản trước đó</button>' +
          '<button class="btn" type="button" data-act="drop" data-id="' + sr.id + '"' + (sr.draft && sr.pub ? '' : ' disabled aria-disabled="true"') + '>Bỏ thay đổi</button></div>' +
          '<p class="hint" style="margin:0">' + (sr.draft ? 'Đang có bản nháp chưa xuất bản. Hãy xuất bản hoặc bỏ thay đổi trước, rồi mới khôi phục bản cũ.' : 'Khôi phục tạo một bản nháp từ bản trước; bạn cần xuất bản để du khách thấy.') + '</p></section>';
      }
      mount(shell('Quản trị tuyến', 'SCR-M03-001', 'routes',
        '<section class="stack" aria-labelledby="rt-h"><div class="row between"><h2 id="rt-h" style="margin:0">Danh sách tuyến</h2><button class="btn btn-primary" type="button" data-act="create">Tạo tuyến</button></div>' +
        '<div class="pair"><div class="field"><label for="q">Tìm theo tên tuyến</label><input id="q" type="search" value="' + esc(q) + '"></div><div class="field"><label for="f">Lọc theo trạng thái</label><select id="f">' +
        [['', 'Tất cả'], ['NHAP', 'Nháp'], ['HOAT_DONG', 'Đang hoạt động'], ['TAM_DONG', 'Tạm đóng'], ['LUU_TRU', 'Đã lưu trữ']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Bảng tuyến"><table><caption class="sr-only">Danh sách tuyến</caption><thead><tr><th scope="col">Tuyến</th><th scope="col">Trạng thái</th><th scope="col">Thông tin</th><th scope="col">Thao tác</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="hint" style="margin:0">Tuyến không bao giờ tự mở lại. Lưu trữ không thể hoàn tác và chỉ áp dụng cho tuyến Tạm đóng.</p></section>' + hist));
      var qi = document.getElementById('q'); qi.addEventListener('input', function () { q = qi.value; var p = qi.selectionStart; view.render(); var n = document.getElementById('q'); n.focus(); n.setSelectionRange(p, p); });
      document.getElementById('f').addEventListener('change', function (e) { f = e.target.value; view.render(); });
    };
    function res(r, okMsg) { if (r.ok) { flash = { kind: 'ok', title: 'Đã thực hiện', text: okMsg }; } else flash = { kind: 'err', title: r.title, text: r.msg }; view.render(); }
    view.acts = {
      create: function () { var r = C.createRoute(); if (r.ok) go('route-edit.html?id=' + r.id); else res(r); },
      hist: function (d) { sel = d.id; view.render(); document.getElementById('hs-h') && document.getElementById('hs-h').scrollIntoView({ block: 'nearest' }); },
      restore: function (d) { var r = C.restoreRoute(d.id); if (r.ok) { setFlash('ok', 'Đã tạo bản nháp', 'Bản nháp lấy từ bản ' + r.from + '. Hãy xem lại rồi xuất bản.'); go('route-edit.html?id=' + d.id); } else res(r); },
      drop: function (d) { if (confirm('Bỏ mọi thay đổi chưa xuất bản của tuyến này?')) res(C.discardDraft('route', d.id), 'Đã bỏ thay đổi, về bản đang hiển thị.'); },
      close: function (d) { var r = C.by.route(d.id); modal({ title: 'Đóng tạm tuyến', html: '<p>Tuyến "' + esc(eName('route', r)) + '" sẽ ẩn khỏi lựa chọn của du khách; các chuyến đang đi không bị dừng.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Đóng tạm' }).then(function (v) { if (v) res(C.closeRoute(d.id, v.r), 'Đã đóng tạm tuyến.'); }); },
      reopen: function (d) { var r = C.by.route(d.id); modal({ title: 'Mở lại tuyến', html: '<p>Tuyến "' + esc(eName('route', r)) + '" sẽ lại hiện cho du khách chọn.</p>', fields: [{ id: 'r', label: 'Ghi chú xác nhận an toàn (bắt buộc)', hint: 'Tối đa 300 ký tự.' }], ok: 'Mở lại' }).then(function (v) { if (v) res(C.reopenRoute(d.id, v.r), 'Đã mở lại tuyến.'); }); },
      archive: function (d) { var r = C.by.route(d.id); modal({ title: 'Lưu trữ tuyến', html: '<p>Lưu trữ tuyến "' + esc(eName('route', r)) + '" không thể hoàn tác; dữ liệu vẫn được giữ cho lịch sử và báo cáo.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Lưu trữ', danger: true }).then(function (v) { if (v) res(C.archiveRoute(d.id, v.r), 'Đã lưu trữ tuyến.'); }); },
      discard: function (d) { var r = C.by.route(d.id); modal({ title: 'Hủy tuyến', html: '<p>Hủy tuyến "' + esc(eName('route', r)) + '": tuyến chưa từng xuất bản này sẽ không dùng được nữa.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Hủy tuyến', danger: true }).then(function (v) { if (v) res(C.discardRoute(d.id, v.r), 'Đã hủy tuyến.'); }); }
    };
    view.render();
  }

  /* ================= 002 BIÊN TẬP TUYẾN ================= */
  function pRouteEdit() {
    var id = qs('id'), r = C.by.route(id), errs = {}, fl = flash;
    if (!r) { mount(shell('Biên tập tuyến', 'SCR-M03-002', 'routes', banner('err', 'Không tìm thấy tuyến', 'Tuyến này không tồn tại.') + '<p><a href="routes.html">Về danh sách tuyến</a></p>')); return; }
    W = JSON.parse(JSON.stringify(C.cur(r)));
    var ro = r.status === 'LUU_TRU';
    function f(k, label, type, extra) {
      var v = W[k] == null ? '' : W[k];
      return '<div class="field"><label for="f_' + k + '">' + label + '</label>' + (type === 'area' ? '<textarea id="f_' + k + '" data-bind="' + k + '"' + (ro ? ' disabled' : '') + '>' + esc(v) + '</textarea>' : '<input id="f_' + k + '" type="text" data-bind="' + k + '" value="' + esc(v) + '"' + (ro ? ' disabled' : '') + (errs[k] ? ' aria-invalid="true" aria-describedby="e_' + k + '"' : '') + '>') + (extra ? '<span class="hint">' + extra + '</span>' : '') + err('e_' + k, errs[k]) + '</div>';
    }
    view.render = function () {
      var rv = C.review('route', id), miss = rv && !rv.noDraft ? rv.issues : [];
      var avail = C.state().checkpoints.filter(function (c) { return c.pub && c.status !== 'LUU_TRU' && W.checkpointIds.indexOf(c.id) < 0; });
      var list = W.checkpointIds.map(function (cid, i) {
        var c = C.by.cp(cid);
        return '<li class="row between"><span><span class="num">' + (i + 1) + '</span>' + esc(eName('cp', c)) + ' ' + chip(c.status) + '</span><span class="row">' +
          (ro ? '' : '<button class="btn" type="button" data-act="up" data-i="' + i + '"' + (i === 0 ? ' disabled aria-disabled="true"' : '') + ' aria-label="Đưa lên">↑</button><button class="btn" type="button" data-act="down" data-i="' + i + '"' + (i === W.checkpointIds.length - 1 ? ' disabled aria-disabled="true"' : '') + ' aria-label="Đưa xuống">↓</button><button class="btn" type="button" data-act="rm" data-i="' + i + '">Bỏ</button>') + '</span></li>';
      }).join('');
      mount(shell('Biên tập tuyến', 'SCR-M03-002', 'routes',
        (fl ? '' : '') + '<div class="ver-strip"><strong>' + esc(eName('route', r)) + '</strong>' + chip(r.status) + (r.draft ? '<span class="chip draft">Bản nháp — du khách chưa thấy.</span>' : '<span class="chip ok">Bản đang hiển thị' + (r.version ? ' (bản ' + r.version + ')' : '') + '</span>') + '</div>' +
        (ro ? banner('warn', 'Chỉ đọc', 'Tuyến đã lưu trữ hoặc đã hủy, không sửa được.') : '') +
        (errs._ ? banner('err', 'Chưa lưu được', errs._) : '') +
        '<div class="split main-aside"><div class="stack">' +
        '<section class="card stack" aria-labelledby="s1"><h2 id="s1">Thẻ tuyến</h2><div class="pair">' + f('nameVi', 'Tên tuyến (Tiếng Việt)') + f('nameEn', 'Tên tuyến (English)') + '</div>' + f('short', 'Mô tả ngắn', 'area') +
        '<div class="pair">' + f('distanceKm', 'Quãng đường (km)', 0, 'Lớn hơn 0, tối đa 100, một chữ số sau dấu phẩy.') + f('durationMin', 'Thời lượng (phút)', 0, 'Số nguyên lớn hơn 0, tối đa 1440.') + '</div>' +
        '<div class="field"><label for="f_difficulty">Độ khó</label><select id="f_difficulty" data-bind="difficulty"' + (ro ? ' disabled' : '') + '><option value="">Chưa chọn</option>' + Object.keys(L.diff).map(function (k) { return '<option value="' + k + '"' + (W.difficulty === k ? ' selected' : '') + '>' + L.diff[k] + '</option>'; }).join('') + '</select></div></section>' +
        '<section class="card stack" aria-labelledby="s2"><h2 id="s2">Chi tiết</h2>' + f('startVi', 'Điểm xuất phát (Tiếng Việt)') + f('safetyVi', 'Cảnh báo an toàn (Tiếng Việt)', 'area') +
        '<div class="check"><input id="f_noWarn" type="checkbox" data-bind="noWarn" data-rerender' + (W.noWarn ? ' checked' : '') + (ro || String(W.safetyVi || '').trim() ? ' disabled' : '') + '><label for="f_noWarn">Tuyến không có cảnh báo an toàn cần nêu</label></div>' +
        '<div class="check"><input id="f_offlineMap" type="checkbox" data-bind="offlineMap"' + (W.offlineMap ? ' checked' : '') + (ro ? ' disabled' : '') + '><label for="f_offlineMap">Sơ đồ tuyến cần cho khi không có mạng (tính vào gói tải trước)</label></div></section>' +
        '<section class="card stack" aria-labelledby="s4"><h2 id="s4">Điểm dừng của tuyến (' + W.checkpointIds.length + '/' + C.LIMIT_CP + ')</h2>' + err('e_checkpointIds', errs.checkpointIds) +
        (list ? '<ul class="list-plain">' + list + '</ul>' : '<p style="margin:0">Chưa chọn điểm dừng nào.</p>') +
        (ro ? '' : '<div class="row"><div class="field grow"><label for="addcp">Thêm điểm dừng đã xuất bản</label><select id="addcp"><option value="">Chọn điểm dừng…</option>' + avail.map(function (c) { return '<option value="' + c.id + '">' + esc(c.pub.nameVi) + ' — ' + L.status[c.status] + '</option>'; }).join('') + '</select></div><button class="btn" type="button" data-act="addcp" style="align-self:end">Thêm</button><a class="btn" href="checkpoints.html?create=1&back=' + encodeURIComponent('route-edit.html?id=' + id) + '" style="align-self:end">Tạo điểm dừng mới</a></div>') + '</section></div>' +
        '<aside class="stack"><section class="card stack-sm" aria-labelledby="mh"><h2 id="mh">Còn thiếu để xuất bản</h2>' + (miss.length ? '<ul style="margin:0;padding-left:20px">' + miss.map(function (m) { return '<li>' + esc(m.msg) + '</li>'; }).join('') + '</ul>' : '<p style="margin:0">' + (r.draft ? 'Đủ điều kiện (theo bản nháp đã lưu).' : 'Chưa có bản nháp mới.') + '</p>') + '<p class="hint" style="margin:0">Tính theo bản nháp đã lưu gần nhất.</p></section>' +
        '<section class="card stack-sm"><h2>Phiên bản</h2><p class="small" style="margin:0">' + (r.version ? 'Đang hiển thị: bản ' + r.version + '.' : 'Chưa từng xuất bản.') + '</p><div class="row"><button class="btn" type="button" data-act="restore"' + (r.draft || r.snapshots.length < 2 || ro ? ' disabled aria-disabled="true"' : '') + '>Khôi phục bản trước</button><button class="btn" type="button" data-act="drop"' + (r.draft && r.pub && !ro ? '' : ' disabled aria-disabled="true"') + '>Bỏ thay đổi</button></div></section></aside></div>' +
        '<div class="sticky-actions" role="group" aria-label="Hành động chính"><a class="btn" href="routes.html" data-act="back">Danh sách tuyến</a>' + (ro ? '' : '<button class="btn btn-primary" type="button" data-act="save">Lưu bản nháp</button><button class="btn" type="button" data-act="publish" style="margin-left:auto">Xuất bản</button>') + '</div>'));
      if (fl) { fl = null; }
      var s = document.getElementById('addcp'); if (s) s.addEventListener('change', function () { s.dataset.v = s.value; });
    };
    function save(done) {
      var res = C.saveRoute(id, W);
      if (res.ok) { dirty = false; r = C.by.route(id); errs = {}; if (done) done(); else { flash = { kind: 'ok', title: 'Đã lưu bản nháp', text: 'Bản nháp đã được lưu. Du khách chưa thấy.' }; view.render(); } }
      else { errs = res.errors || { _: res.msg }; flash = null; view.render(); }
    }
    view.acts = {
      save: function () { save(); },
      publish: function () { save(function () { go('review.html?kind=route&id=' + id); }); },
      addcp: function () { var v = document.getElementById('addcp').value; if (!v) return; if (W.checkpointIds.indexOf(v) >= 0) { errs.checkpointIds = C.MSG.dupCp; } else if (W.checkpointIds.length >= C.LIMIT_CP) { errs.checkpointIds = C.MSG.limitCp; } else { W.checkpointIds.push(v); errs.checkpointIds = ''; dirty = true; } view.render(); },
      rm: function (d) { W.checkpointIds.splice(+d.i, 1); dirty = true; errs.checkpointIds = ''; view.render(); },
      up: function (d) { var i = +d.i, a = W.checkpointIds; a.splice(i - 1, 0, a.splice(i, 1)[0]); dirty = true; view.render(); },
      down: function (d) { var i = +d.i, a = W.checkpointIds; a.splice(i + 1, 0, a.splice(i, 1)[0]); dirty = true; view.render(); },
      restore: function () { var x = C.restoreRoute(id); if (x.ok) { dirty = false; setFlash('ok', 'Đã tạo bản nháp', 'Bản nháp lấy từ bản ' + x.from + '.'); location.reload(); } else { flash = { kind: 'err', title: x.title, text: x.msg }; view.render(); } },
      drop: function () { if (confirm('Bỏ mọi thay đổi chưa xuất bản?')) { var x = C.discardDraft('route', id); if (x.ok) { dirty = false; setFlash('ok', 'Đã bỏ thay đổi', 'Về bản đang hiển thị.'); location.reload(); } } },
      back: function (d, b) { if (leaveOk()) go('routes.html'); }
    };
    view.render();
  }

  /* ================= 008 THƯ VIỆN ĐIỂM DỪNG ================= */
  function pCheckpoints() {
    var q = '', f = '', back = qs('back');
    if (qs('create') === '1') { var cr = C.createCp(); if (cr.ok) { go('checkpoints.html?id=' + cr.id + (back ? '&back=' + encodeURIComponent(back) : '')); return; } }
    var id = qs('id') || (C.state().checkpoints.filter(function (c) { return !c.discarded; })[0] || {}).id, c = C.by.cp(id), errs = {};
    if (c) W = JSON.parse(JSON.stringify(C.cur(c)));
    view.render = function () {
      var st = C.state();
      var rows = st.checkpoints.filter(function (x) {
        if (x.discarded && f !== 'LUU_TRU') return false; if (f && x.status !== f) return false;
        return !q || eName('cp', x).toLowerCase().indexOf(q.toLowerCase()) >= 0;
      }).map(function (x) { var mode = (C.cur(x) || {}).mode;
        return '<tr' + (x.id === id ? ' aria-current="true"' : '') + '><td><a href="checkpoints.html?id=' + x.id + (back ? '&back=' + encodeURIComponent(back) : '') + '" data-act="pick" data-id="' + x.id + '"><strong>' + esc(eName('cp', x)) + '</strong></a><br><span class="small">' + (mode ? L.mode[mode] : 'Chưa chọn loại kết nối') + ' · ' + C.liveQrCount(x.id) + ' điểm tham quan</span></td><td>' + chip(x.discarded ? 'LUU_TRU' : x.status, x.discarded ? 'Đã hủy' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="2">Không có điểm dừng nào khớp.</td></tr>';
      var det = '';
      if (c) {
        var ro = c.status === 'LUU_TRU', isR = rev(), users = C.routesListing(id), qrs = C.qrsOf(id).filter(function (x) { return !x.discarded; });
        var live = C.liveQrCount(id);
        det = '<div class="ver-strip"><h2 style="margin:0">' + esc(eName('cp', c)) + '</h2>' + chip(c.status) + (c.draft ? '<span class="chip draft">Bản nháp — du khách chưa thấy.</span>' : '<span class="chip ok">Bản đang hiển thị</span>') + '</div>' +
          (c.status === 'TAM_DONG' && c.closure ? banner('warn', 'Điểm dừng đang tạm đóng', c.closure.reason + ' · ' + fmt(c.closure.at)) : '') +
          '<div class="card stack"><h3>Thông tin điểm dừng</h3><div class="pair"><div class="field"><label for="c_nameVi">Tên (Tiếng Việt)</label><input id="c_nameVi" type="text" data-bind="nameVi" value="' + esc(W.nameVi) + '"' + (ro ? ' disabled' : '') + (errs.nameVi ? ' aria-invalid="true"' : '') + '><span class="hint">Tối đa 100 ký tự.</span>' + err('e1', errs.nameVi) + '</div>' +
          '<div class="field"><label for="c_nameEn">Tên (English)</label><input id="c_nameEn" lang="en" type="text" data-bind="nameEn" value="' + esc(W.nameEn) + '"' + (ro ? ' disabled' : '') + '>' + err('e2', errs.nameEn) + '</div></div>' +
          '<div class="field"><label for="c_mode">Loại kết nối</label><select id="c_mode" data-bind="mode" data-rerender' + (ro ? ' disabled' : '') + '><option value="">Chưa chọn</option>' + Object.keys(L.mode).map(function (k) { return '<option value="' + k + '"' + (W.mode === k ? ' selected' : '') + '>' + L.mode[k] + '</option>'; }).join('') + '</select></div>' +
          '<div class="check"><input id="c_verified" type="checkbox" data-bind="verified"' + (W.verified ? ' checked' : '') + (ro || W.mode !== 'ONLINE' ? ' disabled' : '') + '><label for="c_verified">Đã khảo sát thực địa, có sóng ổn định</label></div><p class="hint" style="margin:-8px 0 0">Chỉ chọn được khi loại kết nối là "Dùng được khi có mạng".</p>' +
          '<div class="field"><label for="c_note">Ghi chú vị trí (nội bộ)</label><textarea id="c_note" data-bind="note"' + (ro ? ' disabled' : '') + '>' + esc(W.note) + '</textarea><span class="hint">Tối đa 300 ký tự. Không bao giờ hiện cho du khách.</span>' + err('e3', errs.note) + '</div></div>' +
          '<div class="card stack"><div class="row between"><h3 style="margin:0">Điểm tham quan (' + live + '/' + C.LIMIT_QR + ')</h3><button class="btn" type="button" data-act="addqr"' + (ro ? ' disabled aria-disabled="true"' : '') + '>Thêm điểm tham quan</button></div>' +
          '<div class="table-wrap" tabindex="0" role="region" aria-label="Điểm tham quan của điểm dừng"><table><caption class="sr-only">Điểm tham quan</caption><thead><tr><th scope="col">Tên</th><th scope="col">Trạng thái</th><th scope="col">Sẵn sàng</th><th scope="col">Mã</th></tr></thead><tbody>' +
          (qrs.map(function (x) { var cc = C.cur(x) || {}, miss = ['nameVi', 'nameEn', 'introVi', 'introEn'].filter(function (k) { return !String(cc[k] || '').trim(); }); var lab = { nameVi: 'tên tiếng Việt', nameEn: 'tên tiếng Anh', introVi: 'giới thiệu tiếng Việt', introEn: 'giới thiệu tiếng Anh' };
            return '<tr><td><a href="qr-edit.html?id=' + x.id + '">' + esc(eName('qr', x)) + '</a></td><td>' + chip(x.status) + '</td><td>' + (miss.length ? 'Chưa đủ: ' + esc(lab[miss[0]]) : 'Sẵn sàng') + '</td><td>' + esc(C.qrShort(x.id)) + '</td></tr>'; }).join('') || '<tr><td colspan="4">Chưa có điểm tham quan.</td></tr>') + '</tbody></table></div></div>' +
          '<div class="card"><h3>Tuyến đang dùng điểm dừng này</h3>' + (users.length ? '<ul class="list-plain">' + users.map(function (r) { return '<li><a href="route-edit.html?id=' + r.id + '">' + esc(eName('route', r)) + '</a> — ' + chip(r.status) + '</li>'; }).join('') + '</ul>' : '<p style="margin:0">Chưa có tuyến nào dùng.</p>') + '</div>' +
          '<div class="sticky-actions" role="group" aria-label="Hành động chính">' + (back ? '<a class="btn" href="' + esc(back) + '" data-act="goback">Quay lại tuyến</a>' : '') + (ro ? '' : '<button class="btn btn-primary" type="button" data-act="save">Lưu bản nháp</button><button class="btn" type="button" data-act="publish" style="margin-left:auto">Xuất bản</button>') + '</div>' +
          '<div class="card stack-sm"><h3>Phiên bản</h3><p class="small" style="margin:0">' + (c.pub ? 'Đã xuất bản: ' + fmt(c.publishedAt) : 'Chưa từng xuất bản.') + '</p><div class="row"><button class="btn" type="button" data-act="drop"' + (c.draft && c.pub && !ro ? '' : ' disabled aria-disabled="true"') + '>Bỏ thay đổi</button></div></div>' +
          '<div class="card stack-sm"><h3>Đóng và mở lại</h3><div class="row">' + (c.status === 'HOAT_DONG' ? '<button class="btn" type="button" data-act="close">Đóng tạm</button>' : '') +
          (c.status === 'TAM_DONG' ? (isR ? '<button class="btn" type="button" data-act="reopen">Mở lại</button>' : '<button class="btn" type="button" disabled aria-disabled="true">Mở lại (chỉ quản lý)</button>') : '') + (c.status !== 'HOAT_DONG' && c.status !== 'TAM_DONG' ? '<span class="small">Không áp dụng cho trạng thái hiện tại.</span>' : '') + '</div></div>' +
          '<div class="zone stack-sm" role="group" aria-label="Hành động không hoàn tác"><h3>Hành động không hoàn tác</h3><div class="row">' +
          (c.status === 'TAM_DONG' ? (isR ? '<button class="btn btn-danger" type="button" data-act="archive">Lưu trữ</button>' : '<button class="btn btn-danger" type="button" disabled aria-disabled="true">Lưu trữ (chỉ quản lý)</button>') : '<button class="btn btn-danger" type="button" disabled aria-disabled="true">Lưu trữ</button>') +
          (!c.pub && c.status === 'NHAP' ? '<button class="btn btn-danger" type="button" data-act="discard">Hủy</button>' : '<button class="btn btn-danger" type="button" disabled aria-disabled="true">Hủy</button>') + '</div><p class="hint" style="margin:0">Lưu trữ chỉ dùng cho điểm dừng đang Tạm đóng và không còn tuyến nào liệt kê. Hủy chỉ dùng cho điểm dừng chưa từng xuất bản.</p></div>';
      } else det = '<p>Chưa có điểm dừng nào.</p>';
      mount(shell('Thư viện điểm dừng', 'SCR-M03-008', 'checkpoints',
        '<div class="split"><section class="stack" aria-labelledby="list-h"><h2 id="list-h">Danh sách điểm dừng</h2><div class="field"><label for="q">Tìm theo tên</label><input id="q" type="search" value="' + esc(q) + '"></div>' +
        '<div class="field"><label for="f">Lọc theo trạng thái</label><select id="f">' + [['', 'Tất cả'], ['NHAP', 'Nháp'], ['HOAT_DONG', 'Đang hoạt động'], ['TAM_DONG', 'Tạm đóng'], ['LUU_TRU', 'Đã lưu trữ']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<button class="btn btn-primary" type="button" data-act="create">Tạo điểm dừng</button><div class="table-wrap"><table class="compact"><caption class="sr-only">Điểm dừng trong thư viện</caption><thead><tr><th scope="col">Điểm dừng</th><th scope="col">Trạng thái</th></tr></thead><tbody>' + rows + '</tbody></table></div></section><section class="stack" aria-labelledby="det">' + det + '</section></div>'));
      var qi = document.getElementById('q'); qi.addEventListener('input', function () { q = qi.value; var p = qi.selectionStart; var keep = W; view.render(); W = keep; var n = document.getElementById('q'); n.focus(); n.setSelectionRange(p, p); });
      document.getElementById('f').addEventListener('change', function (e) { f = e.target.value; view.render(); });
    };
    function res(r, okMsg) { if (r.ok) flash = { kind: 'ok', title: 'Đã thực hiện', text: okMsg || (r.note || '') }; else flash = { kind: 'err', title: r.title || 'Chưa thực hiện được', text: r.msg }; if (r.ok) { c = C.by.cp(id); W = JSON.parse(JSON.stringify(C.cur(c))); dirty = false; } view.render(); }
    function save(done) { var r = C.saveCp(id, W); if (r.ok) { errs = {}; dirty = false; c = C.by.cp(id); if (done) done(); else res(r, 'Đã lưu bản nháp. Du khách chưa thấy.'); } else { errs = r.errors || {}; flash = r.errors ? null : { kind: 'err', title: r.title, text: r.msg }; view.render(); } }
    view.acts = {
      pick: function (d, b) { if (leaveOk()) go(b.getAttribute('href')); },
      create: function () { if (!leaveOk()) return; var r = C.createCp(); if (r.ok) go('checkpoints.html?id=' + r.id + (back ? '&back=' + encodeURIComponent(back) : '')); },
      goback: function () { if (leaveOk()) go(back); },
      save: function () { save(); },
      publish: function () { save(function () { go('review.html?kind=cp&id=' + id); }); },
      drop: function () { if (confirm('Bỏ mọi thay đổi chưa xuất bản?')) res(C.discardDraft('cp', id), 'Đã bỏ thay đổi.'); },
      addqr: function () { var proceed = function () { var r = C.createQr(id); if (r.ok) go('qr-edit.html?id=' + r.id); else res(r); }; if (dirty) { save(proceed); } else proceed(); },
      close: function () {
        var imp = C.closeCpImpact(id), names = imp.routes.map(function (r) { return esc(eName('route', r)); });
        modal({ title: 'Đóng tạm "' + eName('cp', c) + '"', html: '<p>' + (names.length ? 'Điểm dừng này có trong ' + names.length + ' tuyến: ' + names.join(', ') + '.' : 'Điểm dừng này chưa có trong tuyến nào.') + '</p>' + (imp.willClose.length ? '<p><strong>Các tuyến sau sẽ tự đóng tạm vì hết điểm dừng hoạt động:</strong> ' + imp.willClose.map(function (r) { return esc(eName('route', r)); }).join(', ') + '.</p>' : ''), fields: [{ id: 'r', label: 'Lý do (bắt buộc)', hint: 'Không để trống, tối đa 300 ký tự. Lý do là nội bộ.' }], ok: 'Đóng tạm' }).then(function (v) {
          if (!v) return; var r = C.closeCp(id, v.r);
          res(r, 'Đã đóng tạm điểm dừng.' + (r.ok && r.autoClosed.length ? ' Tuyến tự đóng: ' + r.autoClosed.join(', ') + '.' : ''));
        });
      },
      reopen: function () { modal({ title: 'Mở lại "' + eName('cp', c) + '"', fields: [{ id: 'r', label: 'Ghi chú xác nhận an toàn (bắt buộc)', hint: 'Tối đa 300 ký tự.' }], ok: 'Mở lại' }).then(function (v) { if (v) { var r = C.reopenCp(id, v.r); res(r, 'Đã mở lại điểm dừng. ' + (r.note || '')); } }); },
      archive: function () { modal({ title: 'Lưu trữ "' + eName('cp', c) + '"', html: '<p>Lưu trữ không thể hoàn tác; dữ liệu vẫn được giữ cho lịch sử và báo cáo.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Lưu trữ', danger: true }).then(function (v) { if (v) res(C.archiveCp(id, v.r), 'Đã lưu trữ điểm dừng.'); }); },
      discard: function () { modal({ title: 'Hủy "' + eName('cp', c) + '"', html: '<p>Điểm dừng chưa từng xuất bản này sẽ không dùng được nữa.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Hủy điểm dừng', danger: true }).then(function (v) { if (v) { var r = C.discardCp(id, v.r); if (r.ok) { setFlash('ok', 'Đã hủy', 'Điểm dừng đã bị hủy.'); go('checkpoints.html'); } else res(r); } }); }
    };
    view.render();
  }

  /* ================= 003 ĐIỂM THAM QUAN (QR) ================= */
  function pQr() {
    var id = qs('id'), q = C.by.qr(id), errs = {};
    if (!q) { mount(shell('Điểm tham quan', 'SCR-M03-003', 'checkpoints', banner('err', 'Không tìm thấy', 'Điểm tham quan này không tồn tại.'))); return; }
    var cp = C.by.cp(q.checkpointId);
    W = JSON.parse(JSON.stringify(C.cur(q))); W.label = q.label || '';
    var ro = q.status === 'THU_HOI';
    view.render = function () {
      var miss = ['nameVi', 'nameEn', 'introVi', 'introEn'].filter(function (k) { return !String(W[k] || '').trim(); });
      function fi(k, label, area, hint) { return '<div class="field"><label for="q_' + k + '">' + label + '</label>' + (area ? '<textarea id="q_' + k + '" data-bind="' + k + '"' + (ro ? ' disabled' : '') + '>' + esc(W[k]) + '</textarea>' : '<input id="q_' + k + '" type="text" data-bind="' + k + '" value="' + esc(W[k]) + '"' + (ro ? ' disabled' : '') + '>') + (hint ? '<span class="hint">' + hint + '</span>' : '') + err('e_' + k, errs[k]) + '</div>'; }
      mount(shell('Điểm tham quan (QR) & Nội dung', 'SCR-M03-003', 'checkpoints',
        '<div class="ver-strip"><h2 style="margin:0">Đang sửa: ' + esc(eName('qr', q)) + '</h2>' + chip(q.status) + (q.draft ? '<span class="chip draft">Bản nháp — du khách chưa thấy.</span>' : '<span class="chip ok">Bản đang hiển thị</span>') + '<span class="small">' + esc(C.qrShort(q.id)) + ' · thuộc điểm dừng <a href="checkpoints.html?id=' + cp.id + '">' + esc(eName('cp', cp)) + '</a></span></div>' +
        (ro ? banner('warn', q.discarded ? 'Đã hủy' : 'Đã thu hồi', (q.reason || '') + ' Mã này không còn dùng được.') : '') +
        '<div class="card stack"><div class="pair">' + fi('nameVi', 'Tên đối tượng (Tiếng Việt)') + fi('nameEn', 'Tên đối tượng (English)') + '</div><div class="pair">' + fi('introVi', 'Giới thiệu (Tiếng Việt)', 1) + fi('introEn', 'Giới thiệu (English)', 1) + '</div>' +
        '<div class="field"><label for="q_label">Ghi chú lắp đặt (nội bộ)</label><input id="q_label" type="text" data-bind="label" value="' + esc(W.label) + '"' + (ro ? ' disabled' : '') + '><span class="hint">Tối đa 300 ký tự.</span>' + err('e_label', errs.label) + '</div>' +
        '<p style="margin:0">' + (miss.length ? '<span class="chip warn">Chưa đủ</span> Còn thiếu ' + miss.length + ' mục để xuất bản.' : '<span class="chip ok">Sẵn sàng</span> Đủ nội dung để xuất bản.') + '</p>' +
        '<p class="hint" style="margin:0">Bản demo không có upload ảnh/audio/video và tải ảnh mã QR.</p></div>' +
        '<div class="sticky-actions" role="group" aria-label="Hành động chính"><a class="btn" href="checkpoints.html?id=' + cp.id + '" data-act="back">Về điểm dừng</a>' + (ro ? '' : '<button class="btn btn-primary" type="button" data-act="save">Lưu bản nháp</button><button class="btn" type="button" data-act="preview">Xem trước như du khách</button><button class="btn" type="button" data-act="publish" style="margin-left:auto">Xuất bản</button>') + '</div>' +
        (ro ? '' : '<div class="card stack-sm"><h3>Phiên bản</h3><div class="row"><button class="btn" type="button" data-act="drop"' + (q.draft && q.pub ? '' : ' disabled aria-disabled="true"') + '>Bỏ thay đổi</button></div></div>' +
          '<div class="zone stack-sm"><h3>Hành động không hoàn tác</h3><div class="row">' + (q.pub ? '<button class="btn btn-danger" type="button" data-act="revoke">Thu hồi mã</button>' : '<button class="btn btn-danger" type="button" data-act="discard">Hủy điểm tham quan</button>') + '</div><p class="hint" style="margin:0">Không thu hồi được mã cuối của điểm dừng đang hoạt động. Hủy chỉ dùng cho điểm tham quan chưa từng xuất bản.</p></div>')));
    };
    function save(done) { var r = C.saveQr(id, W, W.label); if (r.ok) { errs = {}; dirty = false; q = C.by.qr(id); if (done) done(); else { flash = { kind: 'ok', title: 'Đã lưu bản nháp', text: 'Bản nháp đã được lưu.' }; view.render(); } } else { errs = r.errors || {}; flash = r.errors ? null : { kind: 'err', title: r.title, text: r.msg }; view.render(); } }
    view.acts = {
      save: function () { save(); },
      publish: function () { save(function () { go('review.html?kind=qr&id=' + id); }); },
      back: function (d, b) { if (leaveOk()) go(b.getAttribute('href')); },
      drop: function () { if (confirm('Bỏ mọi thay đổi chưa xuất bản?')) { var r = C.discardDraft('qr', id); if (r.ok) { setFlash('ok', 'Đã bỏ thay đổi', 'Về bản đang hiển thị.'); dirty = false; location.reload(); } } },
      preview: function () { modal({ title: 'Xem trước như du khách', html: '<h3>Tiếng Việt</h3><p><strong>' + esc(W.nameVi) + '</strong></p><p>' + esc(W.introVi) + '</p><h3>English</h3><p><strong>' + esc(W.nameEn) + '</strong></p><p>' + esc(W.introEn) + '</p>', ok: false, cancel: 'Đóng' }); },
      revoke: function () { modal({ title: 'Thu hồi mã', html: '<p>Mã ' + esc(C.qrShort(q.id)) + ' sẽ không dùng được nữa. Điểm dừng "' + esc(eName('cp', cp)) + '" phải còn ít nhất một mã đang hoạt động.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Thu hồi', danger: true }).then(function (v) { if (!v) return; var r = C.revokeQr(id, v.r); if (r.ok) { setFlash('ok', 'Đã thu hồi mã', 'Mã không còn dùng được.'); go('checkpoints.html?id=' + cp.id); } else { flash = { kind: 'err', title: r.title, text: r.msg }; view.render(); } }); },
      discard: function () { modal({ title: 'Hủy điểm tham quan', html: '<p>Điểm tham quan chưa từng xuất bản này sẽ không dùng được nữa.</p>', fields: [{ id: 'r', label: 'Lý do (bắt buộc)' }], ok: 'Hủy', danger: true }).then(function (v) { if (!v) return; var r = C.discardQr(id, v.r); if (r.ok) { setFlash('ok', 'Đã hủy', 'Điểm tham quan đã bị hủy.'); go('checkpoints.html?id=' + cp.id); } else { flash = { kind: 'err', title: r.title, text: r.msg }; view.render(); } }); }
    };
    view.render();
  }

  /* ================= 004 XEM LẠI & XUẤT BẢN ================= */
  function pReview() {
    var kind = qs('kind'), id = qs('id'), done = null, bad = null;
    function backUrl() { return kind === 'route' ? 'route-edit.html?id=' + id : kind === 'cp' ? 'checkpoints.html?id=' + id : 'qr-edit.html?id=' + id; }
    view.render = function () {
      var rv = C.review(kind, id);
      if (!rv) { mount(shell('Xem lại và xuất bản', 'SCR-M03-004', 'routes', banner('err', 'Không tìm thấy', 'Không có mục cần xuất bản.'))); return; }
      var e = rv.entity, nm = eName(kind, e), blocked = rv.issues.length > 0;
      var h = (done ? banner('ok', 'Đã xuất bản', 'Đã xuất bản. Du khách sẽ thấy nội dung mới.' + (done.version ? ' Tuyến hiện ở bản ' + done.version + '.' : '') + (done.affected.length && kind !== 'route' ? ' Tuyến liên quan có bản mới: ' + done.affected.join(', ') + '.' : '')) : '') + (bad ? banner('err', 'Chưa xuất bản được', bad) : '');
      if (rv.noDraft) { mount(shell('Xem lại và xuất bản', 'SCR-M03-004', 'routes', h + (done ? '' : banner('info', 'Không có thay đổi', 'Mục này không có bản nháp để xuất bản.')) + '<div class="row"><a class="btn" href="' + backUrl() + '">Quay lại</a><a class="btn" href="routes.html">Danh sách tuyến</a></div>')); return; }
      var title = kind === 'route' ? 'Thông tin tuyến và danh sách điểm dừng' : kind === 'cp' ? 'Điểm dừng' : 'Điểm tham quan (một mã QR)';
      mount(shell(title, 'SCR-M03-004', kind === 'route' ? 'routes' : 'checkpoints',
        h + '<p style="margin:0"><strong>' + esc(nm) + '</strong> <span class="chip draft">Bản nháp ' + (rv.first ? 'sẽ là bản đầu tiên' : 'sẽ thay bản đang chạy') + '</span></p>' +
        (blocked ? '<section class="card stack" aria-labelledby="bl"><h2 id="bl">Chưa thể xuất bản: cần sửa các mục sau</h2><ul class="issues">' + rv.issues.map(function (i) { return '<li><span>' + esc(i.msg) + '</span>' + (i.soft ? '' : '<a href="' + backUrl() + '">Đi tới ô cần sửa</a>') + '</li>'; }).join('') + '</ul></section>' : '') +
        '<section class="card stack" aria-labelledby="cmp"><h2 id="cmp">Thay đổi so với bản đang chạy</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Bảng so sánh"><table><caption class="sr-only">So sánh bản đang chạy và bản mới</caption><thead><tr><th scope="col">Ô</th><th scope="col">Bản đang chạy</th><th scope="col">Bản mới</th></tr></thead><tbody>' +
        (rv.rows.map(function (r) { return '<tr' + (r.sens ? ' class="sens"' : '') + '><th scope="row">' + esc(r.label) + (r.sens ? ' <span class="chip warn">Thay đổi nhạy cảm</span>' : '') + '</th><td class="old">' + esc(r.oldV) + '</td><td class="new">' + esc(r.newV) + '</td></tr>'; }).join('') || '<tr><td colspan="3">Không có khác biệt.</td></tr>') + '</tbody></table></div></section>' +
        '<section class="card stack" aria-labelledby="imp"><h2 id="imp">Tác động</h2>' + (rv.affected.length ? '<p style="margin:0">Thay đổi này ảnh hưởng ' + rv.affected.length + ' tuyến: ' + rv.affected.map(function (r) { return esc(eName('route', r)); }).join(', ') + '. Mỗi tuyến sẽ có một bản hành trình mới; gói tải trước của du khách cần cập nhật.</p>' +
          '<div class="table-wrap"><table class="compact"><thead><tr><th scope="col">Tuyến</th><th scope="col">Trạng thái</th><th scope="col">Dung lượng tải trước ước tính</th></tr></thead><tbody>' + rv.sizes.map(function (s) { return '<tr><td>' + esc(eName('route', s.route)) + '</td><td>' + chip(s.route.status) + '</td><td>' + (s.mb > C.OFFLINE_MB ? '<strong>' + s.mb + ' MB (vượt mức ' + C.OFFLINE_MB + ' MB)</strong>' : s.mb + ' MB') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p style="margin:0">Chưa có tuyến nào dùng mục này.</p>') + '<ul style="margin:0;padding-left:20px"><li>Phiên đang chạy không bị đổi giữa chừng.</li></ul></section>' +
        (rv.needSafety || (kind === 'route' && e.draft && e.draft.noWarn && !String(e.draft.safetyVi || '').trim()) ? '<section class="card stack-sm" aria-labelledby="sf"><h2 id="sf">Xác nhận an toàn</h2><p style="margin:0">Hãy nhập cảnh báo an toàn ở màn biên tập, hoặc tick xác nhận tuyến không có cảnh báo an toàn cần nêu.</p><div class="check"><input id="safe" type="checkbox" data-act="safe"' + (e.draft.noWarn ? ' checked' : '') + '><label for="safe">Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu</label></div></section>' : '') +
        '<div class="sticky-actions" role="group" aria-label="Hành động chính"><a class="btn" href="' + backUrl() + '">Quay lại sửa</a>' + (blocked || done ? '<button class="btn btn-primary" type="button" disabled aria-disabled="true">Xuất bản</button>' : '<button class="btn btn-primary" type="button" data-act="publish">Xuất bản</button>') + '</div>'));
      var sf = document.getElementById('safe'); if (sf) sf.addEventListener('change', function () { C.tickNoWarn(id, sf.checked); view.render(); });
    };
    view.acts = {
      publish: function () {
        var e = C.ent(kind, id);
        modal({ title: 'Xuất bản "' + eName(kind, e) + '"', html: '<p>Xuất bản "' + esc(eName(kind, e)) + '": du khách sẽ thấy nội dung mới ngay sau khi xuất bản.</p>', ok: 'Xuất bản' }).then(function (v) {
          if (!v) return; var r = C.publish(kind, id); if (r.ok) { done = r; bad = null; } else bad = r.msg; view.render();
        });
      }
    };
    view.render();
  }

  /* ================= 005 BÁO CÁO ================= */
  function pReports() {
    var tab = 1, routeId = '', st = '';
    function today() { var d = new Date(Date.now() + 7 * 3600000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
    function s2(p) { return pad(p.d) + '/' + pad(p.m) + '/' + p.y; }
    var t = today(), t0 = new Date(Date.UTC(t.y, t.m - 1, t.d) - 29 * 86400000);
    var from = s2({ d: t0.getUTCDate(), m: t0.getUTCMonth() + 1, y: t0.getUTCFullYear() }), to = s2(t);
    function parse(s) { var m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN; }
    view.render = function () {
      var a = parse(from), b = parse(to), msg = '';
      if (isNaN(a) || isNaN(b) || a > b) msg = 'dates'; else if ((b - a) / 86400000 + 1 > 366) msg = 'span';
      var rep = msg ? null : C.report(a - 7 * 3600000, b + 86400000 - 7 * 3600000, routeId);
      var li = C.state().lastIngestionAt, lp = li ? vn(li) : null, none = !C.state().sessions.length;
      var body = '<div class="stack-sm"><p class="small" style="margin:0">' + (none ? 'Chưa có chuyến đi nào được gửi về hệ thống.' : 'Số liệu tính đến ' + lp.t + ' ngày ' + lp.d + '.') + '</p><p class="small" style="margin:0">Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời.</p></div>' +
        '<section class="card stack"><div class="pair"><div class="field"><label for="from">Từ ngày</label><input id="from" type="text" inputmode="numeric" placeholder="dd/mm/yyyy" value="' + esc(from) + '"' + (msg ? ' aria-invalid="true"' : '') + '></div><div class="field"><label for="to">Đến ngày</label><input id="to" type="text" inputmode="numeric" placeholder="dd/mm/yyyy" value="' + esc(to) + '"></div></div>' +
        (msg === 'dates' ? err('de', 'Hãy chọn đủ ngày bắt đầu và ngày kết thúc, ngày bắt đầu không được sau ngày kết thúc.') : '') + (msg === 'span' ? err('se', 'Khoảng thời gian chọn quá dài. Hãy chọn tối đa 366 ngày.') : '') +
        '<div class="row"><div class="field grow"><label for="rt">Tuyến</label><select id="rt"><option value="">Tất cả tuyến</option>' + C.state().routes.filter(function (r) { return r.pub; }).map(function (r) { return '<option value="' + r.id + '"' + (r.id === routeId ? ' selected' : '') + '>' + esc(eName('route', r)) + '</option>'; }).join('') + '</select></div><button class="btn btn-primary" type="button" data-act="apply" style="align-self:end">Áp dụng</button></div>' +
        '<p class="hint" style="margin:0">Mặc định là 30 ngày gần nhất tính theo giờ Việt Nam, gồm cả ngày đầu và ngày cuối.</p></section>' +
        '<div class="tabs" role="tablist" aria-label="Loại báo cáo"><button role="tab" type="button" data-act="tab" data-t="1" aria-selected="' + (tab === 1) + '">Tổng hợp chuyến đi</button><button role="tab" type="button" data-act="tab" data-t="2" aria-selected="' + (tab === 2) + '">Lượt ghé theo điểm dừng</button></div>';
      if (!rep) body += '';
      else if (!rep.total) body += '<p>Không có chuyến đi nào trong khoảng thời gian đã chọn.</p>';
      else if (tab === 1) body += '<section class="stack" role="tabpanel"><h2 style="margin:0">Tổng hợp chuyến đi</h2><div class="stats">' + [['Tổng chuyến đi', rep.total], ['Hoàn thành', rep.done], ['Bỏ dở', rep.abandoned], ['Tỷ lệ hoàn thành', (rep.done / rep.total * 100).toFixed(1).replace('.', ',') + '%'], ['Tỷ lệ bỏ dở', (rep.abandoned / rep.total * 100).toFixed(1).replace('.', ',') + '%']].map(function (x) { return '<div class="stat"><div class="v">' + x[1] + '</div><div class="l">' + x[0] + '</div></div>'; }).join('') + '</div></section>';
      else body += '<section class="stack" role="tabpanel"><h2 style="margin:0">Lượt ghé theo điểm dừng</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Bảng lượt ghé"><table><thead><tr><th scope="col">Tuyến</th><th scope="col">Điểm dừng</th><th scope="col" class="n">Thứ tự</th><th scope="col" class="n">Số chuyến đi</th></tr></thead><tbody>' + rep.rows.map(function (x) { var r = C.by.route(x.routeId); return '<tr><th scope="row">' + esc(r ? eName('route', r) : x.routeId) + '</th><td>' + esc(x.name) + '</td><td class="n">' + x.sequence + '</td><td class="n">' + x.count + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small" style="margin:0">Một lượt ghé là một lần quét mã QR, không chứng minh du khách đã có mặt tại chỗ.</p></section>';
      mount(shell('Báo cáo vận hành', 'SCR-M03-005', 'reports', body));
      document.getElementById('from').addEventListener('input', function (e) { from = e.target.value; });
      document.getElementById('to').addEventListener('input', function (e) { to = e.target.value; });
      document.getElementById('rt').addEventListener('change', function (e) { routeId = e.target.value; });
    };
    view.acts = { apply: function () { view.render(); }, tab: function (d) { tab = +d.t; view.render(); } };
    view.render();
  }

  /* ================= 006 TÀI KHOẢN ================= */
  function pAccounts() {
    var st = C.state(), em = '', role = 'CONTENT_STAFF', ferr = '';
    view.render = function () {
      if (!rev()) { mount(shell('Tài khoản & Vai trò', 'SCR-M03-006', 'accounts', NOPERM())); return; }
      var rows = C.state().accounts.map(function (a) {
        var act = '';
        if (a.status === 'INVITATION_PENDING') act = '<button class="btn" type="button" data-act="resend" data-e="' + esc(a.email) + '">Gửi lại lời mời</button><a class="btn" href="accept.html?mode=invite&email=' + encodeURIComponent(a.email) + '">Giả lập: mở link lời mời</a>';
        else if (a.status === 'ACTIVE') act = '<button class="btn" type="button" data-act="role" data-e="' + esc(a.email) + '">Đổi vai trò</button><button class="btn btn-danger" type="button" data-act="lock" data-e="' + esc(a.email) + '">Khóa</button>';
        else act = '<button class="btn" type="button" data-act="unlock" data-e="' + esc(a.email) + '">Mở khóa</button>';
        return '<tr' + (a.email === me().email ? ' aria-current="true"' : '') + '><th scope="row">' + esc(a.email) + (a.email === me().email ? ' <span class="small">(bạn)</span>' : '') + '</th><td>' + esc(L.role[a.role]) + '</td><td>' + chip(a.status) + '</td><td><div class="row-actions">' + act + '</div></td></tr>';
      }).join('');
      mount(shell('Tài khoản & Vai trò', 'SCR-M03-006', 'accounts',
        '<div class="split main-aside"><section class="stack" aria-labelledby="acc-h"><h2 id="acc-h" style="margin:0">Danh sách tài khoản</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Bảng tài khoản"><table><caption class="sr-only">Danh sách tài khoản quản trị</caption><thead><tr><th scope="col">Email</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="hint" style="margin:0">Chỉ có hai vai trò cố định. Không thể khóa hoặc hạ quyền quản lý đang hoạt động cuối cùng.</p></section>' +
        '<section class="card stack" aria-labelledby="inv-h"><h2 id="inv-h" style="margin:0">Mời người dùng</h2><div class="field"><label for="iem">Email người được mời</label><input id="iem" type="text" inputmode="email" value="' + esc(em) + '"' + (ferr ? ' aria-invalid="true" aria-describedby="ie"' : '') + '>' + err('ie', ferr) + '<span class="hint">Tối đa 254 ký tự.</span></div>' +
        '<div class="field"><label for="irole">Vai trò</label><select id="irole"><option value="CONTENT_STAFF"' + (role === 'CONTENT_STAFF' ? ' selected' : '') + '>Nhân viên nội dung</option><option value="REVIEWER"' + (role === 'REVIEWER' ? ' selected' : '') + '>Quản lý</option></select></div><button class="btn btn-primary" type="button" data-act="invite">Gửi lời mời</button></section></div>'));
      document.getElementById('iem').addEventListener('input', function (e) { em = e.target.value; });
      document.getElementById('irole').addEventListener('change', function (e) { role = e.target.value; });
    };
    function res(r, okMsg) { flash = r.ok ? { kind: 'ok', title: 'Đã thực hiện', text: okMsg } : { kind: 'err', title: r.title || 'Chưa thực hiện được', text: r.msg }; view.render(); }
    view.acts = {
      invite: function () { var r = C.invite(em, role); if (r.field) { ferr = r.msg; flash = null; view.render(); } else { ferr = ''; if (r.ok) em = ''; res(r, r.ok ? 'Đã gửi lời mời tới ' + r.email + '. (Demo: dùng nút "Giả lập: mở link lời mời" để nhận lời mời.)' : ''); } },
      resend: function (d) { var r = C.resend(d.e); res(r, 'Đã gửi lại lời mời tới ' + d.e + '.'); },
      role: function (d) { var a = C.by.acct(d.e); modal({ title: 'Đổi vai trò', html: '<p>Đổi vai trò của ' + esc(a.email) + '.</p>', fields: [{ id: 'r', type: 'select', label: 'Vai trò mới', value: a.role, options: [['REVIEWER', 'Quản lý'], ['CONTENT_STAFF', 'Nhân viên nội dung']] }], ok: 'Đổi vai trò' }).then(function (v) { if (v) res(C.setRole(d.e, v.r), 'Đã đổi vai trò của ' + d.e + '.'); }); },
      lock: function (d) { modal({ title: 'Khóa tài khoản', html: '<p>Tài khoản ' + esc(d.e) + ' sẽ không đăng nhập được cho tới khi được mở khóa.</p>', ok: 'Khóa', danger: true }).then(function (v) { if (v) res(C.setLocked(d.e, true), 'Đã khóa ' + d.e + '.'); }); },
      unlock: function (d) { res(C.setLocked(d.e, false), 'Đã mở khóa ' + d.e + '.'); }
    };
    view.render();
  }

  /* ================= 009 NHẬT KÝ ================= */
  function pAudit() {
    var f = { who: '', kind: '', out: '', from: '', to: '' };
    function pd(s) { var m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) - 7 * 3600000 : NaN; }
    function link(a) { if (!a.entityId) return esc(a.entityName); var u = a.kind === 'route' ? 'route-edit.html?id=' : a.kind === 'cp' ? 'checkpoints.html?id=' : 'qr-edit.html?id='; return '<a href="' + u + a.entityId + '">' + esc(a.entityName) + '</a>'; }
    view.render = function () {
      if (!rev()) { mount(shell('Nhật ký hệ thống', 'SCR-M03-009', 'audit', NOPERM())); return; }
      var A = C.state().audit, a0 = pd(f.from), a1 = pd(f.to);
      var rows = A.filter(function (x) {
        if (f.who && x.actor !== f.who) return false; if (f.kind && x.kind !== f.kind) return false; if (f.out && x.outcome !== f.out) return false;
        var t = Date.parse(x.at); if (!isNaN(a0) && t < a0) return false; if (!isNaN(a1) && t >= a1 + 86400000) return false; return true;
      });
      var actors = A.map(function (x) { return x.actor; }).filter(function (v, i, s) { return v && s.indexOf(v) === i; });
      mount(shell('Nhật ký hệ thống', 'SCR-M03-009', 'audit',
        '<section class="card stack" aria-labelledby="flt"><h2 id="flt" style="margin:0">Bộ lọc</h2><div class="pair"><div class="field"><label for="who">Người thực hiện</label><select id="who"><option value="">Tất cả</option>' + actors.map(function (a) { return '<option' + (a === f.who ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="kind">Loại mục</label><select id="kind">' + [['', 'Tất cả'], ['route', 'Tuyến'], ['cp', 'Điểm dừng'], ['qr', 'Điểm tham quan (QR)'], ['acct', 'Tài khoản']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.kind ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="out">Kết quả</label><select id="out">' + [['', 'Tất cả'], ['OK', 'Thành công'], ['FAIL', 'Không thành công']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.out ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="from">Từ ngày</label><input id="from" type="text" placeholder="dd/mm/yyyy" value="' + esc(f.from) + '"></div><div class="field"><label for="to">Đến ngày</label><input id="to" type="text" placeholder="dd/mm/yyyy" value="' + esc(f.to) + '"></div></div><div class="row"><button class="btn btn-primary" type="button" data-act="apply">Áp dụng</button><button class="btn" type="button" data-act="clear">Xóa bộ lọc</button></div></section>' +
        '<section class="stack"><h2 style="margin:0">Các dòng nhật ký (' + rows.length + ')</h2>' + (rows.length ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Bảng nhật ký"><table class="log-table" style="min-width:860px"><caption class="sr-only">Nhật ký thao tác toàn hệ thống</caption><thead><tr><th scope="col">Lúc nào</th><th scope="col">Ai</th><th scope="col">Mục nào</th><th scope="col">Trước và sau</th><th scope="col">Kết quả</th><th scope="col">Lý do / tuyến bị ảnh hưởng</th></tr></thead><tbody>' +
        rows.map(function (x) { return '<tr><td>' + fmt(x.at) + '</td><td>' + esc(x.actor || '—') + '</td><td>' + link(x) + '<br><span class="small">' + esc(x.action) + '</span>' + (x.selfPublished ? ' <span class="chip info">Tự xuất bản</span>' : '') + '</td><td><div class="ba"><span>Trước: ' + esc(x.before || '—') + '</span><span>Sau: ' + esc(x.after || '—') + '</span></div></td><td>' + (x.outcome === 'OK' ? '<span class="chip ok">Thành công</span>' : '<span class="chip err">Không thành công</span>') + '</td><td>' + esc(x.reason || '—') + (x.affected && x.affected.length ? '<br><span class="small">Tuyến bị ảnh hưởng: ' + esc(x.affected.join(', ')) + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>Không có dòng nhật ký nào khớp bộ lọc.</p>') +
        '<p class="hint" style="margin:0">Nhật ký chỉ đọc: các dòng chỉ được thêm vào, không sửa hay xóa.</p></section>'));
    };
    view.acts = {
      apply: function () { f = { who: document.getElementById('who').value, kind: document.getElementById('kind').value, out: document.getElementById('out').value, from: document.getElementById('from').value, to: document.getElementById('to').value }; view.render(); },
      clear: function () { f = { who: '', kind: '', out: '', from: '', to: '' }; view.render(); }
    };
    view.render();
  }

  /* ---------- khởi động ---------- */
  var PAGES = { index: pIndex, login: pLogin, accept: pAccept, routes: pRoutes, 'route-edit': pRouteEdit, checkpoints: pCheckpoints, 'qr-edit': pQr, review: pReview, reports: pReports, accounts: pAccounts, audit: pAudit };
  if (page !== 'index' && page !== 'login' && page !== 'accept' && !guard()) return;
  PAGES[page]();
})();
