// Free VIP table reservation — no payment. Creates a $0 booking (lead); staff
// assigns the actual table + collects the bottle minimum at the door.
Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const { event_date, table_type, customer_name, customer_phone, party_size, visitor_id } = await req.json()

    const VALID = ["vip_couch", "vip_high_top"]
    if (!event_date || !customer_name || !customer_phone || !VALID.includes(table_type)) {
      return new Response(JSON.stringify({ error: "Name, phone, date, and a valid VIP table type required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const dbHeaders = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    }

    const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${event_date}&select=id`, { headers: dbHeaders })
    const events = await evResp.json()
    if (!events?.[0]?.id) {
      return new Response(JSON.stringify({ error: "Event not found for that date" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const bookingResp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: { ...dbHeaders, "Prefer": "return=representation" },
      body: JSON.stringify({
        event_id: events[0].id,
        booking_type: table_type,           // vip_couch | vip_high_top
        customer_name,
        customer_email: null,
        customer_phone,
        party_size: Math.max(parseInt(party_size) || 1, 1),
        amount_paid: 0,                      // free reservation — pay at door
        status: "reservation",               // distinct from paid 'confirmed' table bookings
        visitor_id: visitor_id || null,
      }),
    })
    const booking = await bookingResp.json()
    const bookingId = booking?.[0]?.id || null

    return new Response(JSON.stringify({
      status: "reserved",
      message: "Table reservation received! We'll confirm your table — bottle minimum due at the door.",
      booking_id: bookingId,
      table_type,
      event_date,
      customer_name,
    }), { headers: { ...cors, "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
