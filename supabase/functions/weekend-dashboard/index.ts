// weekend-dashboard — PIN-gated aggregate stats for the upcoming active events.
// Returns ONLY totals (counts + revenue). No customer names/emails/phones leave the server.
// verify_jwt = false so the static page can call it with the public anon key; the PIN is the gate.

const PIN = "Casita21"; // change here + redeploy to rotate

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!;

function money(cents: number) { return Math.round(cents) / 100; }

const TABLE_LABELS: Record<string, string> = {
  vip_couch: "VIP Couch",
  regular_couch: "Regular Couch",
  vip_high_top: "VIP High-Top",
  regular_high_top: "Regular High-Top",
};
const SLOT_LABELS: Record<string, string> = {
  before_midnight: "Before midnight",
  after_midnight: "After midnight",
  all_night: "All night",
};

async function sbGet(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) throw new Error(`supabase ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function stripeList(resource: string, sinceUnix: number) {
  const out: any[] = [];
  let startingAfter: string | null = null;
  const auth = "Basic " + btoa(STRIPE_SK + ":");
  for (let i = 0; i < 20; i++) {
    const qs = new URLSearchParams({ limit: "100", "created[gte]": String(sinceUnix) });
    if (startingAfter) qs.set("starting_after", startingAfter);
    const r = await fetch(`https://api.stripe.com/v1/${resource}?${qs}`, { headers: { Authorization: auth } });
    if (!r.ok) throw new Error(`stripe ${resource}: ${r.status} ${await r.text()}`);
    const d = await r.json();
    out.push(...d.data);
    if (!d.has_more) break;
    startingAfter = d.data[d.data.length - 1].id;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.pin !== PIN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Upcoming active events (today onward). New York date.
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const todayStr = today.toISOString().slice(0, 10);
    const events: any[] = await sbGet(
      `events?is_active=eq.true&event_date=gte.${todayStr}&select=id,event_date,title&order=event_date.asc`
    );

    // Stripe window: 45 days back covers any pre-sale for upcoming events.
    const since = Math.floor(Date.now() / 1000) - 45 * 86400;
    const sessions = await stripeList("checkout/sessions", since);
    const refunds = await stripeList("refunds", since);

    // payment_intent -> event_date, for refund attribution
    const piToDate: Record<string, string> = {};
    for (const s of sessions) {
      const ed = s.metadata?.event_date;
      if (s.payment_intent && ed) piToDate[s.payment_intent] = ed;
    }
    const refundByDate: Record<string, number> = {};
    for (const r of refunds) {
      const ed = piToDate[r.payment_intent];
      if (ed) refundByDate[ed] = (refundByDate[ed] || 0) + (r.amount || 0);
    }
    // Stripe paid tickets per event_date
    const stripeByDate: Record<string, { tickets: number; gross: number }> = {};
    for (const s of sessions) {
      if (s.payment_status !== "paid") continue;
      const ed = s.metadata?.event_date;
      if (!ed) continue;
      const q = parseInt(s.metadata?.quantity || "1") || 1;
      stripeByDate[ed] = stripeByDate[ed] || { tickets: 0, gross: 0 };
      stripeByDate[ed].tickets += q;
      stripeByDate[ed].gross += s.amount_total || 0;
    }

    const result = [];
    let grandFree = 0, grandTickets = 0, grandNet = 0, grandTables = 0, grandTableRev = 0;

    for (const ev of events) {
      const bookings: any[] = await sbGet(
        `bookings?event_id=eq.${ev.id}&status=eq.confirmed&select=booking_type,amount_paid,customer_name,time_slot,party_size`
      );
      let freeGa = 0, freeLadies = 0, tables = 0, tableRev = 0;
      const tableList: any[] = [];
      for (const b of bookings) {
        const t = b.booking_type || "";
        if (t === "dance_ga_free") freeGa++;
        else if (t === "ladies_free") freeLadies++;
        else {
          tables++; tableRev += b.amount_paid || 0; // couch / high_top reservations
          tableList.push({
            type: TABLE_LABELS[t] || t,
            name: b.customer_name || "—",
            amount: money(b.amount_paid || 0),
            slot: b.time_slot ? (SLOT_LABELS[b.time_slot] || b.time_slot) : null,
            party: b.party_size || null,
          });
        }
      }
      const st = stripeByDate[ev.event_date] || { tickets: 0, gross: 0 };
      const refunded = refundByDate[ev.event_date] || 0;
      const net = st.gross - refunded;
      const free = freeGa + freeLadies;
      const headcount = free + st.tickets;

      grandFree += free; grandTickets += st.tickets; grandNet += net;
      grandTables += tables; grandTableRev += tableRev;

      result.push({
        date: ev.event_date,
        name: ev.title,
        free_ga: freeGa,
        free_ladies: freeLadies,
        free_total: free,
        paid_tickets: st.tickets,
        paid_gross: money(st.gross),
        refunds: money(refunded),
        paid_net: money(net),
        tables,
        table_rev: money(tableRev),
        table_list: tableList,
        headcount,
      });
    }

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      events: result,
      totals: {
        free: grandFree,
        paid_tickets: grandTickets,
        paid_net: money(grandNet),
        tables: grandTables,
        table_rev: money(grandTableRev),
        headcount: grandFree + grandTickets,
      },
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
