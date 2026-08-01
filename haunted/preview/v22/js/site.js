/* THE HAUNTED MANSION — preview build
   ------------------------------------------------------------------
   ⚠️ PREVIEW MODE. Lead-capture inserts are tagged first_name='Preview',
   last_name='Test' so they are trivially filterable out of the real
   signups list. ON PROMOTION: change PREVIEW_MODE to false — that swaps
   the tag to first_name='Haunted', last_name='Mansion' (the live
   convention). See handoff brief §7.2.
   ------------------------------------------------------------------ */

var PREVIEW_MODE = true;

var SUPABASE_URL = 'https://tqeunmqnaoyrerkbhokk.supabase.co';
// anon key — public by design, safe in client code (RLS enforced server-side)
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXVubXFuYW95cmVya2Job2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTQ1MzQsImV4cCI6MjA4OTQ3MDUzNH0.hkkuc7_YE2yf0w0NQENpahAxqxxqBfjq8n5QhtTIkw8';

function leadTag(){
  return PREVIEW_MODE
    ? { first_name:'Preview', last_name:'Test' }
    : { first_name:'Haunted', last_name:'Mansion' };
}

function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); }
function validPhone(v){ return (v.replace(/\D/g,'').length >= 10); }

function wireSignup(form){
  if(!form) return;
  var msg = form.querySelector('.form-msg');
  var btn = form.querySelector('button[type=submit]');

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var email = (form.querySelector('[name=email]').value || '').trim();
    var phone = (form.querySelector('[name=phone]').value || '').trim();

    msg.className = 'form-msg';
    if(!validEmail(email)){ msg.className='form-msg err'; msg.textContent='Enter a valid email.'; return; }
    if(!validPhone(phone)){ msg.className='form-msg err'; msg.textContent='Enter a valid phone number.'; return; }

    var tag = leadTag();
    var body = { first_name:tag.first_name, last_name:tag.last_name, email:email, phone:phone };

    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = 'Sending…';
    msg.textContent = '';

    fetch(SUPABASE_URL + '/rest/v1/signups', {
      method:'POST',
      headers:{
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    }).then(function(r){
      if(r.status === 201 || r.status === 204){
        form.querySelector('.fields').style.display = 'none';
        msg.className = 'form-msg ok';
        msg.textContent = "You're on the list. We'll be in touch before the doors open.";
      } else {
        return r.text().then(function(t){ throw new Error(t || ('HTTP ' + r.status)); });
      }
    }).catch(function(err){
      msg.className = 'form-msg err';
      msg.textContent = 'Something went wrong. Try again in a moment.';
      btn.disabled = false;
      btn.textContent = original;
      if(window.console) console.error('signup failed:', err);
    });
  });
}

/* scroll reveal */
function wireReveal(){
  var els = document.querySelectorAll('.rise');
  if(!els.length) return;
  if(!('IntersectionObserver' in window) ||
     window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(var i=0;i<els.length;i++) els[i].classList.add('in');
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
  for(var j=0;j<els.length;j++) io.observe(els[j]);
}

document.addEventListener('DOMContentLoaded', function(){
  var forms = document.querySelectorAll('form.signup-form');
  for(var i=0;i<forms.length;i++) wireSignup(forms[i]);
  wireReveal();
});


/* ---- countdown to opening night (Fri Sept 4 2026, doors 10pm ET) ---- */
function wireCountdown(){
  var box = document.querySelector('[data-countdown]');
  if(!box) return;
  var target = Date.UTC(2026, 8, 5, 2, 0, 0);   /* 2026-09-05T02:00Z = Sep 4, 10pm ET */
  var slots = {
    d: box.querySelector('[data-cd=d]'), h: box.querySelector('[data-cd=h]'),
    m: box.querySelector('[data-cd=m]'), s: box.querySelector('[data-cd=s]')
  };
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function tick(){
    var left = target - Date.now();
    if(left < 0) left = 0;
    var sec = Math.floor(left / 1000);
    slots.d.textContent = Math.floor(sec / 86400);
    slots.h.textContent = pad(Math.floor(sec / 3600) % 24);
    slots.m.textContent = pad(Math.floor(sec / 60) % 60);
    slots.s.textContent = pad(sec % 60);
  }
  tick();
  setInterval(tick, 1000);
}
document.addEventListener('DOMContentLoaded', wireCountdown);
