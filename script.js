// Texte aus dem <body data-…> der jeweiligen Sprache
const T = document.body.dataset;

// Nav-Zustand beim Scrollen + Zurück-nach-oben-Knopf
const nav = document.getElementById('nav'), toTop = document.getElementById('totop');
addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 40);
  toTop.classList.toggle('show', y > 900);
}, { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

// Mobile-Menü
document.getElementById('burger').onclick = () => document.body.classList.toggle('menu-open');
document.querySelectorAll('#mmenu a[href^="#"]').forEach(a => a.onclick = () => document.body.classList.remove('menu-open'));

// Sprachmenü
const dd = document.getElementById('langdd');
dd.querySelector('button').onclick = e => { e.stopPropagation(); dd.classList.toggle('open'); };
document.addEventListener('click', () => dd.classList.remove('open'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') dd.classList.remove('open'); });

// Einblenden beim Scrollen
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// Mietrechner
const s = document.getElementById('sal'), f = n => Math.round(n).toLocaleString('de-CH');
function upd() {
  const v = +s.value;
  s.style.setProperty('--p', ((v - s.min) / (s.max - s.min) * 100) + '%');
  document.getElementById('salv').textContent = f(v);
  const r = Math.round(v / 3 / 50) * 50;
  document.getElementById('rent').textContent = 'CHF ' + f(r);
  document.getElementById('dep').textContent = T.upto + ' CHF ' + f(r * 3);
}
document.querySelectorAll('.calc-toggle button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.calc-toggle button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  document.getElementById('hint').textContent = b.dataset.m === '2' ? T.hint2 : T.hint1;
  if (b.dataset.m === '2' && +s.value < 12000) s.value = 15000;
  upd();
});
s.addEventListener('input', upd); upd();

// An Brevo senden (Formular-Link steht in <body data-brevo>)
function toBrevo(fields) {
  const fd = new FormData();
  fd.append('EMAIL', fields.EMAIL);
  fd.append('VORNAME', fields.VORNAME || '-');
  fd.append('LANG', T.lang);
  fd.append('MOVING', fields.MOVING || '-');
  fd.append('email_address_check', '');   // Spam-Schutz von Brevo, muss leer bleiben
  fd.append('locale', 'de');
  return fetch(T.brevo, { method: 'POST', body: fd, mode: 'no-cors' }).catch(() => {});
}

// Warteliste + Newsletter
document.querySelectorAll('form[data-thanks]').forEach(fm => fm.onsubmit = e => {
  e.preventDefault();
  const email = fm.querySelector('input[type=email]').value.trim();
  if (!email) return;
  toBrevo({ EMAIL: email, MOVING: fm.dataset.source });
  fm.innerHTML = '<span style="padding:10px 16px;color:#5be3cf;font-weight:600">' + fm.dataset.thanks + '</span>';
});

document.getElementById('yr').textContent = new Date().getFullYear();

// Lead-Formular für die Checkliste
const lead = document.getElementById('lead');
const openLead = e => { e.preventDefault(); lead.hidden = false; document.body.classList.add('noscroll'); setTimeout(() => lead.querySelector('input').focus(), 50); };
const closeLead = () => { lead.hidden = true; document.body.classList.remove('noscroll'); };
document.querySelectorAll('[data-lead]').forEach(a => a.addEventListener('click', openLead));
lead.addEventListener('click', e => { if (e.target === lead || e.target.closest('[data-close]')) closeLead(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lead.hidden) closeLead(); });
if (location.hash === '#checklist') lead.hidden = false;
document.getElementById('lead-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target; let ok = true;
  f.querySelectorAll('[required]').forEach(i => {
    const bad = i.type === 'checkbox' ? !i.checked : !i.value.trim() || (i.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));
    (i.type === 'checkbox' ? i.closest('label') : i).classList.toggle('err', bad);
    if (bad) ok = false;
  });
  if (!ok) return;
  toBrevo({ EMAIL: f.EMAIL.value.trim(), VORNAME: f.VORNAME.value.trim(), MOVING: f.MOVING.value });
  lead.querySelector('.lead-form').hidden = true;
  lead.querySelector('.lead-ok').hidden = false;
});

// Anfrage Full Search Support (Web3Forms → Mail an info@)
const pm = document.getElementById('premium');
const closePm = () => { pm.hidden = true; document.body.classList.remove('noscroll'); };
document.querySelectorAll('[data-premium]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); pm.hidden = false; document.body.classList.add('noscroll');
  setTimeout(() => pm.querySelector('input[name=name]').focus(), 50);
}));
if (location.hash === '#premium') { pm.hidden = false; document.body.classList.add('noscroll'); }
pm.addEventListener('click', e => { if (e.target === pm || e.target.closest('[data-close]')) closePm(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pm.hidden) closePm(); });
document.getElementById('pm-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target; let ok = true;
  f.querySelectorAll('[required]').forEach(i => {
    const bad = i.type === 'checkbox' ? !i.checked : !i.value.trim() || (i.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));
    (i.type === 'checkbox' ? i.closest('label') : i).classList.toggle('err', bad);
    if (bad) ok = false;
  });
  if (!ok) return;
  fetch('https://api.web3forms.com/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(Object.fromEntries(new FormData(f)))
  }).catch(() => {});
  pm.querySelector('.lead-form').hidden = true;
  pm.querySelector('.lead-ok').hidden = false;
});
