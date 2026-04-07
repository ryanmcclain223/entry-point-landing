// ── Waitlist count ────────────────────────────────────────────────────────────
// Defaults to 37 until the real count is returned from the API.
var waitlistCount = 37;

// Fetch real count on page load so the number is live even before submission.
fetch('/api/waitlist')
  .then(function (res) { return res.json(); })
  .then(function (data) { if (data && data.success) updateWaitlistCount(data.displayCount); })
  .catch(function () { /* silently ignore — fallback stays at 37 */ });

function updateWaitlistCount(n) {
  waitlistCount = n;
  var el = document.getElementById('waitlistCount');
  if (el) el.textContent = n + ' investors';
}

// POST email to /api/waitlist, then update the visible count.
function submitWaitlist(email) {
  return fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        updateWaitlistCount(data.displayCount);
      }
    })
    .catch(function (err) {
      console.error('Waitlist submission error:', err);
    });
}

// ── Hero form ─────────────────────────────────────────────────────────────────
function heroSubmit() {
  var input = document.getElementById('heroEmail');
  var email = input.value.trim();
  if (!email || !email.includes('@')) {
    input.style.borderColor = 'var(--red)';
    return;
  }
  input.style.borderColor = '';
  document.getElementById('heroForm').style.display = 'none';
  document.getElementById('heroSuccess').style.display = 'block';
  submitWaitlist(email);
}

// ── CTA form ──────────────────────────────────────────────────────────────────
function ctaSubmit() {
  var input = document.getElementById('ctaEmail');
  var email = input.value.trim();
  if (!email || !email.includes('@')) {
    input.style.borderColor = 'var(--red)';
    return;
  }
  input.style.borderColor = '';
  document.getElementById('ctaForm').style.display = 'none';
  document.getElementById('ctaSuccess').style.display = 'block';
  submitWaitlist(email);
}

// Enter-key listeners
document.getElementById('heroEmail').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') heroSubmit();
  this.style.borderColor = '';
});
document.getElementById('ctaEmail').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') ctaSubmit();
  this.style.borderColor = '';
});

// ── Scroll reveal ─────────────────────────────────────────────────────────────
var reveals = document.querySelectorAll('.reveal');
var obs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(function (el) { obs.observe(el); });

// ── Smooth scroll (skip bare # hrefs) ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    var t = document.querySelector(href);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(name) {
  var el = document.getElementById('modal-' + name);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(name) {
  var el = document.getElementById('modal-' + name);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

// ── Stat count-up animation ───────────────────────────────────────────────────
(function () {
  var statBar = document.querySelector('.stats-strip');
  if (!statBar) return;
  var animated = false;
  var obs2 = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      var s2 = document.getElementById('stat2');
      if (s2) {
        var n = 0;
        var t = setInterval(function () { n += 3; if (n >= 91) { n = 91; clearInterval(t); } s2.textContent = n; }, 18);
      }
      var s3 = document.getElementById('stat3');
      if (s3) {
        var v = 0;
        var t2 = setInterval(function () { v += 2; if (v >= 38) { v = 38; clearInterval(t2); } s3.textContent = '$' + v + 'K'; }, 40);
      }
    }
  }, { threshold: 0.5 });
  obs2.observe(statBar);
}());
