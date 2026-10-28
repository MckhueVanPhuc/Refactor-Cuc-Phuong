/* Chỉ đổi trạng thái hiển thị của mockup tĩnh. Không gọi mạng, không lưu dữ liệu. */
(function () {
  var body = document.body;
  var lastFocus = null, opener = null;
  document.addEventListener('focusin', function (e) { if (!e.target.closest('.dialog-backdrop')) lastFocus = e.target; });
  function setState(s) {
    body.dataset.state = s;
    document.querySelectorAll('[data-show]').forEach(function (e) {
      e.hidden = e.dataset.show.split(' ').indexOf(s) < 0;
    });
    document.querySelectorAll('[data-hide]').forEach(function (e) {
      e.hidden = e.dataset.hide.split(' ').indexOf(s) >= 0;
    });
    document.querySelectorAll('.mock-bar [data-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.set === s));
    });
    var d = document.querySelector('.dialog-backdrop:not([hidden]) .dialog');
    document.querySelectorAll('.m03-shell, .phone').forEach(function (e) { if (d) e.setAttribute('inert', ''); else e.removeAttribute('inert'); });
    if (d) { if (!opener) opener = lastFocus; var f = d.querySelector('button, [href], input, textarea'); if (f) f.focus(); }
    else if (opener) { if (document.contains(opener)) opener.focus(); opener = null; }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-set]');
    if (t) setState(t.dataset.set);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.querySelector('.dialog-backdrop:not([hidden])')) setState(body.dataset.base || 'default');
  });
  var m = location.hash.match(/state=([\w-]+)/);
  setState(m ? m[1] : (body.dataset.initial || 'default'));
})();
