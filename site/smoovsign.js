(function () {
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (t, i) { t.style.setProperty('--d', (i % 3) * 80 + 'ms'); io.observe(t); });
  } else { items.forEach(function (t) { t.classList.add('in'); }); }

  var btn = document.getElementById('billing');
  if (!btn) return;
  var vals = document.querySelectorAll('[data-m]');
  var mo = document.getElementById('lbl-m'), yr = document.getElementById('lbl-y');
  var yearly = false;
  btn.addEventListener('click', function () {
    yearly = !yearly;
    btn.setAttribute('aria-pressed', yearly ? 'true' : 'false');
    mo.classList.toggle('on', !yearly); yr.classList.toggle('on', yearly);
    vals.forEach(function (v) {
      v.textContent = yearly ? v.getAttribute('data-y') : v.getAttribute('data-m');
      v.closest('.plan').querySelector('.per').textContent = yearly ? 'לשנה' : 'לחודש';
    });
  });
})();
