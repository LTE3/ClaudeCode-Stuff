/* La Casita — flite-style ticket sheet (vanilla JS).
 *
 * Shared by /fri and /sat flyer pages. Each page sets window.CASITA_EVENT:
 *   { date:'2026-06-19', title:'La Casita del Teteo',
 *     sub:'Fri, Jun 19 · 10PM–4AM · 21+', tableHref:'<admin table deep link>' }
 *
 * SAFETY: single ticket type per checkout. All pricing + inventory is enforced
 * server-side by the Supabase edge functions (create-checkout, claim-free-ticket);
 * this client only presents and forwards. Same anon key + endpoints the live
 * React app already uses.
 */
(function () {
  var SUPABASE_URL = 'https://tqeunmqnaoyrerkbhokk.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXVubXFuYW95cmVya2Job2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTQ1MzQsImV4cCI6MjA4OTQ3MDUzNH0.hkkuc7_YE2yf0w0NQENpahAxqxxqBfjq8n5QhtTIkw8';

  var CFG = window.CASITA_EVENT || {};
  var DATE = CFG.date;

  // Charge amounts (cents) MUST mirror create-checkout's server map so the
  // displayed total equals what Stripe charges. GA tier is resolved from live
  // availability; backend re-resolves/re-validates on its side regardless.
  var GA_TIER_AMT = { ga_tier1: 1000, ga_tier2: 2000, ga_tier3: 2500, ga_tier4: 1500 };

  function vid() { try { return localStorage.getItem('lacasita_vid'); } catch (e) { return null; } }

  // Display-only scarcity caps — mirror of admin-react/src/utils/scarcity.js so the
  // sheet shows the same low "X left" FOMO numbers and never reveals true inventory.
  var CAPS = {
    ga: { '2026-05-29': 24, '2026-05-30': 31 },
    ladies_free: { '2026-05-29': 33, '2026-05-30': 26 },
    free_before: { '2026-05-29': 31, '2026-05-30': 23 },
  };
  var FALLBACK_BASE = { ga: 26, ladies_free: 30, free_before: 28 };
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function scarcityCap(key, date) {
    if (CAPS[key] && CAPS[key][date] != null) return CAPS[key][date];
    var base = FALLBACK_BASE[key] != null ? FALLBACK_BASE[key] : 28;
    return base + (hashStr(key + (date || '')) % 7);
  }
  function showLeft(key, date, real) { return Math.min(Math.max(0, real || 0), scarcityCap(key, date)); }

  function edge(fn, body) {
    return fetch(SUPABASE_URL + '/functions/v1/' + fn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }
  function rpc(fn, body) {
    return fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  // Resolve the active GA tier (first tier with remaining capacity).
  function resolveGA(a) {
    var tiers = [1, 2, 3, 4];
    for (var i = 0; i < tiers.length; i++) {
      var n = tiers[i];
      var cap = a['ga_tier' + n + '_capacity'] || 0;
      var sold = a['ga_tier' + n + '_sold'] || 0;
      if (cap > 0 && sold < cap) {
        return { type: 'ga_tier' + n, amount: GA_TIER_AMT['ga_tier' + n], remaining: cap - sold };
      }
    }
    return { type: 'ga_tier1', amount: GA_TIER_AMT.ga_tier1, remaining: 0, soldOut: true };
  }

  // Build the ticket list for a nightclub event from live availability.
  function buildTickets(a) {
    var lf = (a.ladies_free_remaining != null) ? a.ladies_free_remaining : null;
    var fg = (a.free_ga_remaining != null) ? a.free_ga_remaining
           : ((a.free_ga_capacity || 0) - (a.free_ga_claimed || 0));
    var ga = resolveGA(a);
    return [
      { key: 'ladies_free', name: 'Ladies Free', sub: 'Entry before close', kind: 'free',
        claim_type: 'ladies_free', tag: 'FREE', remaining: lf, shown: showLeft('ladies_free', DATE, lf) },
      { key: 'free_before', name: 'Free before 12:30AM', sub: 'Arrive early', kind: 'free',
        claim_type: 'dance_ga_free', tag: 'FREE', remaining: fg, shown: showLeft('free_before', DATE, fg) },
      { key: 'ga', name: 'General Admission', sub: ga.soldOut ? 'Sold out' : 'Price rises by tier', kind: 'paid',
        ticket_type: ga.type, amount: ga.amount, remaining: ga.remaining, soldOut: ga.soldOut,
        shown: showLeft('ga', DATE, ga.remaining) },
      { key: 'ga_open_bar', name: 'GA + Open Bar', sub: 'Open bar till 12AM · skip the line', kind: 'paid',
        ticket_type: 'ga_open_bar', amount: 10000 },
      { key: 'ladies_group', name: 'Ladies x4', sub: 'Group entry for 4 · best value', kind: 'paid',
        ticket_type: 'ladies_group', amount: 3500 },
      { key: 'table', name: 'Reserve a Table 🌟', sub: 'VIP tables · bottle service', kind: 'link',
        href: CFG.tableHref, priceText: 'from $300' },
    ];
  }

  var state = { tickets: [], selKey: null, qty: 1, screen: 'list' }; // list | details | success
  var els = {};

  function money(cents) { return '$' + Math.round(cents / 100); }

  function selected() {
    for (var i = 0; i < state.tickets.length; i++) if (state.tickets[i].key === state.selKey) return state.tickets[i];
    return null;
  }

  function render() {
    var t = selected();
    if (state.screen === 'success') return; // success view rendered in place
    if (state.screen === 'details' && t) { renderDetails(t); return; }
    renderList();
  }

  function renderList() {
    var body = els.body;
    body.innerHTML = '';
    state.tickets.forEach(function (tk) {
      var row = document.createElement('div');
      var isSel = tk.key === state.selKey;
      var sold = tk.soldOut || (tk.remaining != null && tk.remaining <= 0);
      row.className = 'cs-tk' + (isSel ? ' sel' : '') + (sold ? ' soldout' : '');

      var sub = tk.sub;
      var leftCount = (tk.shown != null) ? tk.shown : tk.remaining;
      if (leftCount != null && !sold) sub = leftCount + ' left · ' + tk.sub;
      if (sold) sub = 'Sold out';

      var right;
      if (tk.kind === 'free') right = '<div class="cs-price free">FREE</div>';
      else if (tk.kind === 'link') right = '<div class="cs-price"><small>from</small> $300</div>';
      else right = '<div class="cs-price">' + money(tk.amount) + '</div>';

      // qty stepper appears on the selected paid/free row
      var stepper = '';
      if (isSel && tk.kind !== 'link') {
        stepper = '<div class="cs-step"><button data-d="-1">−</button>' +
                  '<span class="cs-q">' + state.qty + '</span><button data-d="1">+</button></div>';
      }

      row.innerHTML =
        '<div class="cs-tk-l"><div class="cs-tk-name">' + tk.name +
        (tk.tag ? ' <span class="cs-tag free">' + tk.tag + '</span>' : '') +
        '</div><div class="cs-tk-sub">' + sub + '</div></div>' +
        '<div class="cs-tk-r">' + right + stepper + '</div>' +
        (tk.kind === 'link' ? '<span class="cs-chev">›</span>' : '');

      row.addEventListener('click', function (e) {
        if (e.target.closest('.cs-step')) return; // stepper handled below
        if (tk.kind === 'link') { window.location.href = tk.href; return; }
        state.selKey = tk.key; state.qty = 1; render(); updatePay();
      });
      if (isSel && tk.kind !== 'link') {
        row.querySelectorAll('.cs-step button').forEach(function (b) {
          b.addEventListener('click', function () {
            var max = (tk.remaining != null) ? Math.min(10, tk.remaining) : 10;
            state.qty = Math.max(1, Math.min(max, state.qty + (+b.dataset.d)));
            render(); updatePay();
          });
        });
      }
      body.appendChild(row);
    });
    updatePay();
  }

  function updatePay() {
    var t = selected();
    if (!t || t.kind === 'link') {
      els.payLbl.textContent = 'Select a ticket';
      els.payAmt.textContent = '$0';
      els.payBtn.disabled = true;
      els.payBtn.textContent = 'Continue';
      return;
    }
    var total = t.kind === 'paid' ? t.amount * state.qty : 0;
    els.payAmt.textContent = money(total);
    els.payLbl.textContent = state.qty + ' × ' + t.name;
    els.payBtn.disabled = false;
    els.payBtn.textContent = t.kind === 'free' ? 'Claim free entry' : 'Continue';
  }

  function renderDetails(t) {
    var paid = t.kind === 'paid';
    els.body.innerHTML =
      '<button class="cs-back" id="csBack">‹ Back</button>' +
      '<div class="cs-form">' +
        '<div class="cs-tk" style="cursor:default">' +
          '<div class="cs-tk-l"><div class="cs-tk-name">' + state.qty + ' × ' + t.name + '</div>' +
          '<div class="cs-tk-sub">' + CFG.title + ' · ' + (CFG.date) + '</div></div>' +
          '<div class="cs-tk-r"><div class="cs-price' + (paid ? '' : ' free') + '">' +
            (paid ? money(t.amount * state.qty) : 'FREE') + '</div></div>' +
        '</div>' +
        '<label>Full name</label><input id="csName" type="text" autocomplete="name" placeholder="Your name" />' +
        (paid ? '<label>Email</label><input id="csEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@email.com" />' : '') +
        '<label>Phone</label><input id="csPhone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(___) ___-____" />' +
        '<div class="cs-err" id="csErr2"></div>' +
      '</div>';
    document.getElementById('csBack').addEventListener('click', function () {
      state.screen = 'list'; render();
    });
    els.payLbl.textContent = paid ? money(t.amount * state.qty) + ' total' : state.qty + ' free ticket' + (state.qty > 1 ? 's' : '');
    els.payAmt.textContent = paid ? money(t.amount * state.qty) : 'FREE';
    els.payBtn.disabled = false;
    els.payBtn.textContent = paid ? 'Pay ' + money(t.amount * state.qty) : 'Claim free entry';
  }

  function onPayClick() {
    var t = selected();
    if (!t) return;
    if (state.screen === 'list') {
      // move to details capture
      state.screen = 'details'; render(); return;
    }
    // details screen → submit
    submit(t);
  }

  function submit(t) {
    var name = (document.getElementById('csName') || {}).value || '';
    var phone = (document.getElementById('csPhone') || {}).value || '';
    var email = (document.getElementById('csEmail') || {}).value || '';
    var errEl = document.getElementById('csErr2');
    errEl.textContent = '';
    if (!name.trim()) { errEl.textContent = 'Enter your name.'; return; }
    if (!phone.trim()) { errEl.textContent = 'Enter your phone.'; return; }
    if (t.kind === 'paid' && !email.trim()) { errEl.textContent = 'Enter your email for the receipt.'; return; }

    els.payBtn.disabled = true;
    els.payBtn.textContent = t.kind === 'paid' ? 'Processing…' : 'Claiming…';

    if (t.kind === 'free') {
      edge('claim-free-ticket', {
        event_date: DATE, claim_type: t.claim_type,
        customer_name: name, customer_phone: phone, quantity: state.qty, visitor_id: vid(),
      }).then(function (d) {
        if (d && d.error) { errEl.textContent = d.error; els.payBtn.disabled = false; els.payBtn.textContent = 'Claim free entry'; return; }
        renderSuccess(t, d, name);
      }).catch(function () {
        errEl.textContent = 'Network error. Try again.'; els.payBtn.disabled = false; els.payBtn.textContent = 'Claim free entry';
      });
    } else {
      edge('create-checkout', {
        ticket_type: t.ticket_type, event_date: DATE,
        customer_name: name, customer_email: email, customer_phone: phone,
        quantity: state.qty, visitor_id: vid(),
      }).then(function (d) {
        if (d && d.url) { (window.top || window).location.href = d.url; return; }
        errEl.textContent = (d && d.error) || 'Checkout failed.'; els.payBtn.disabled = false; els.payBtn.textContent = 'Pay ' + money(t.amount * state.qty);
      }).catch(function () {
        errEl.textContent = 'Network error. Try again.'; els.payBtn.disabled = false; els.payBtn.textContent = 'Pay ' + money(t.amount * state.qty);
      });
    }
  }

  function renderSuccess(t, data, name) {
    state.screen = 'success';
    var bid = data && data.booking_id;
    var qrData = bid ? 'https://lacasitabk.com/admin/?verify=free_' + bid : '';
    var qrUrl = qrData ? 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' +
      encodeURIComponent(qrData) + '&bgcolor=0a0a0a&color=ffffff' : '';
    els.body.innerHTML =
      '<div class="cs-ok"><div style="font-size:46px">🎉</div>' +
      '<h3>YOU\'RE IN!</h3>' +
      '<div class="cs-shot">📱 Screenshot this ticket<small>You\'ll need it at the door</small></div>' +
      (qrUrl ? '<div class="cs-qr"><img src="' + qrUrl + '" alt="Ticket QR" /></div>' : '') +
      '<div class="cs-detail">' +
        '<div class="row"><span>Name</span><span>' + (data.customer_name || name) + '</span></div>' +
        '<div class="row"><span>Ticket</span><span>' + t.name + (state.qty > 1 ? ' ×' + state.qty : '') + '</span></div>' +
        '<div class="row"><span>Date</span><span>' + (data.event_date || DATE) + '</span></div>' +
        '<div class="row"><span>Venue</span><span>428 Johnson Ave, BK</span></div>' +
      '</div></div>';
    els.payLbl.textContent = 'See you on the floor';
    els.payAmt.textContent = '';
    els.payBtn.disabled = false;
    els.payBtn.textContent = 'Done';
    els.payBtn.onclick = close;
  }

  function open() {
    document.body.classList.add('cs-open');
    if (!state.tickets.length) loadAvailability();
  }
  function close() {
    document.body.classList.remove('cs-open');
    // reset to list for next open
    setTimeout(function () {
      state.screen = 'list'; state.selKey = null; state.qty = 1;
      els.payBtn.onclick = onPayClick;
      if (state.tickets.length) render();
    }, 400);
  }

  function loadAvailability() {
    els.body.innerHTML = '<div class="cs-loading">Loading tickets…</div>';
    rpc('get_event_availability', { p_event_date: DATE }).then(function (a) {
      if (!a || a.error) { els.body.innerHTML = '<div class="cs-msg">Tickets unavailable right now. <br>Tap below to open the full ticket page.</div>'; return; }
      state.tickets = buildTickets(a);
      render();
    }).catch(function () {
      els.body.innerHTML = '<div class="cs-msg">Couldn\'t load tickets. Check your connection.</div>';
    });
  }

  function mount() {
    var scrim = document.createElement('div'); scrim.className = 'cs-scrim';
    var sheet = document.createElement('div'); sheet.className = 'cs-sheet';
    sheet.innerHTML =
      '<div class="cs-grab"></div>' +
      '<div class="cs-head"><div class="cs-title">Choose your tickets</div>' +
      '<div class="cs-sub">' + (CFG.title || '') + ' · ' + (CFG.sub || '') + '</div>' +
      '<button class="cs-close" aria-label="Close">✕</button></div>' +
      '<div class="cs-body"></div>' +
      '<div class="cs-pay"><div class="cs-pay-l"><div class="cs-pay-lbl">Select a ticket</div>' +
      '<div class="cs-pay-amt">$0</div></div>' +
      '<button class="cs-pay-btn" disabled>Continue</button></div>';
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);

    els.body = sheet.querySelector('.cs-body');
    els.payLbl = sheet.querySelector('.cs-pay-lbl');
    els.payAmt = sheet.querySelector('.cs-pay-amt');
    els.payBtn = sheet.querySelector('.cs-pay-btn');

    scrim.addEventListener('click', close);
    sheet.querySelector('.cs-close').addEventListener('click', close);
    els.payBtn.onclick = onPayClick;

    // wire any element with [data-casita-open] to open the sheet
    document.querySelectorAll('[data-casita-open]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.CasitaSheet = { open: open, close: close };
})();
