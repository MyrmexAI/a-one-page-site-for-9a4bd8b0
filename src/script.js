(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = root.classList.contains('reduced') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Today's date on the masthead (falls back to the static text) */
  function initDate() {
    var el = document.getElementById('today');
    if (!el) return;
    try {
      var d = new Date();
      el.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      el.setAttribute('datetime', d.toISOString().slice(0, 10));
    } catch (e) { /* keep static text */ }
  }

  /* Ticker: duplicate the group so the -50% loop is seamless */
  function initTicker() {
    if (reduce) return;
    var track = document.querySelector('.ticker-track');
    var group = track && track.querySelector('.ticker-group');
    if (!group) return;
    var copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  }

  /* Unfold: the lower half of the page is a clone hinged at the fold line */
  function initUnfold() {
    if (!root.classList.contains('intro')) return;
    var stack = document.querySelector('.stack');
    var sheet = stack && stack.querySelector(':scope > .sheet');
    if (!sheet) { root.classList.remove('intro'); return; }

    var flap = document.createElement('div');
    flap.className = 'flap';
    flap.setAttribute('aria-hidden', 'true');
    if ('inert' in flap) flap.inert = true;

    var copy = sheet.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(function (n) { if (!n.closest('svg')) n.removeAttribute('id'); });
    copy.querySelectorAll('a, button, input, [tabindex]').forEach(function (n) { n.tabIndex = -1; });
    var shade = document.createElement('div');
    shade.className = 'flap-shade';
    flap.appendChild(copy);
    flap.appendChild(shade);
    stack.insertBefore(flap, sheet);

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      root.classList.remove('intro');
      if (flap.parentNode) flap.parentNode.removeChild(flap);
    }
    flap.addEventListener('animationend', function (e) {
      if (e.target === flap && e.animationName === 'unfold') finish();
    });
    setTimeout(finish, 4200);
  }

  /* Count-up figures */
  function formatNumber(value, decimals) {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function initCountUp() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!nodes.length || reduce || !('IntersectionObserver' in window)) return;

    function render(el, value) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      el.textContent = (el.getAttribute('data-prefix') || '') + formatNumber(value, decimals) + (el.getAttribute('data-suffix') || '');
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var duration = 1800;
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        render(el, target * eased);
        if (t < 1) requestAnimationFrame(frame);
        else render(el, target);
      }
      requestAnimationFrame(frame);
    }

    nodes.forEach(function (el) { render(el, 0); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (el) { io.observe(el); });
  }

  /* Stamp button: press, then scroll to the signup coupon */
  function initStamp() {
    var stamp = document.getElementById('stamp');
    var target = document.getElementById('signup');
    var email = document.getElementById('email');
    if (!stamp || !target) return;

    stamp.addEventListener('click', function (e) {
      e.preventDefault();
      stamp.classList.remove('is-stamping');
      void stamp.offsetWidth;
      if (!reduce) stamp.classList.add('is-stamping');
      setTimeout(function () {
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        if (history.replaceState) history.replaceState(null, '', '#signup');
        setTimeout(function () { if (email) email.focus({ preventScroll: true }); }, reduce ? 0 : 750);
      }, reduce ? 0 : 380);
    });
    stamp.addEventListener('animationend', function () { stamp.classList.remove('is-stamping'); });
  }

  /* Coupon form: no backend, so nothing is sent anywhere */
  function initForm() {
    var form = document.getElementById('signup-form');
    var msg = document.getElementById('form-msg');
    var email = document.getElementById('email');
    if (!form || !msg || !email) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.classList.remove('ok');
      if (!email.value || !email.checkValidity()) {
        msg.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      msg.classList.add('ok');
      msg.textContent = 'Clipped! This is a demo coupon: nothing was sent or stored.';
      form.reset();
    });
  }

  initDate();
  initTicker();
  initStamp();
  initForm();
  initCountUp();
  initUnfold();
})();
