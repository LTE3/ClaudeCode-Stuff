Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const { session_id } = await req.json()

  if (!session_id) {
    return new Response(JSON.stringify({ error: "Missing session_id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (session_id.startsWith("free_")) {
    const bookingId = session_id.replace("free_", "")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const bResp = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    })
    const bookings = await bResp.json()
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid ticket" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const b = bookings[0]
    // First-scan stamp — fire and forget, never blocks the scan response.
    // PostgREST filter `scanned_at=is.null` ensures only the first scan writes;
    // re-scans leave the original timestamp intact.
    fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}&scanned_at=is.null`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ scanned_at: new Date().toISOString() }),
    }).catch(() => {})
    return new Response(JSON.stringify({
      id: b.id,
      status: "paid",
      customer_name: b.customer_name || "",
      customer_email: b.customer_email || "",
      ticket_type: b.booking_type || "",
      event_date: b.event_id || "",
      quantity: String(b.party_size || 1),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))

  const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=line_items`, {
    headers: { "Authorization": "Basic " + base64 },
  })
  const session = await resp.json()

  if (session.error) {
    return new Response(JSON.stringify({ error: "Invalid ticket" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const ticket = {
    id: session.id,
    status: session.payment_status,
    customer_name: session.metadata?.customer_name || session.customer_details?.name || "",
    customer_email: session.customer_details?.email || session.metadata?.customer_email || "",
    ticket_type: session.metadata?.ticket_type || "",
    event_date: session.metadata?.event_date || "",
    quantity: session.metadata?.quantity || "1",
    amount_total: session.amount_total,
    created: session.created,
  }

  // Update sold counts and send email if paid
  if (session.payment_status === "paid") {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const dbHeaders = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    }

    // First-scan stamp (paid path) — fire and forget, never blocks the scan response.
    // Filter `scanned_at=is.null` preserves first-scan time across re-scans.
    fetch(`${SUPABASE_URL}/rest/v1/bookings?stripe_session_id=eq.${session.id}&scanned_at=is.null`, {
      method: "PATCH",
      headers: dbHeaders,
      body: JSON.stringify({ scanned_at: new Date().toISOString() }),
    }).catch(() => {})

    // Check if we already processed this session
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/checkout_attempts?stripe_session_id=eq.${session.id}&status=eq.processed&select=id`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    })
    const existing = await checkResp.json()
    const alreadyProcessed = Array.isArray(existing) && existing.length > 0

    if (!alreadyProcessed) {
    // Mark as processed
    await fetch(`${SUPABASE_URL}/rest/v1/checkout_attempts`, {
      method: "POST",
      headers: { ...dbHeaders, "Prefer": "return=minimal" },
      body: JSON.stringify({ stripe_session_id: session.id, customer_name: ticket.customer_name, customer_email: ticket.customer_email, ticket_type: ticket.ticket_type, event_date: ticket.event_date, status: "processed" }),
    })

    // Increment sold count based on ticket type
    const qty = parseInt(ticket.quantity) || 1
    const tt = ticket.ticket_type
    const ed = ticket.event_date

    if (ed && tt) {
      let updateField = ""
      if (tt.startsWith("ga_tier1")) updateField = "ga_tier1_sold"
      else if (tt.startsWith("ga_tier2")) updateField = "ga_tier2_sold"
      else if (tt.startsWith("ga_tier3")) updateField = "ga_tier3_sold"
      else if (tt === "vip_ga") updateField = "vip_ga_sold"
      else if (tt === "dance_ga") updateField = "ga_sold"

      if (updateField) {
        // Use RPC to increment atomically
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_sold`, {
            method: "POST",
            headers: dbHeaders,
            body: JSON.stringify({ p_event_date: ed, p_field: updateField, p_qty: qty }),
          })
        } catch (_) {
          // Fallback: direct update (not atomic but better than nothing)
          const eventResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${ed}&select=${updateField}`, { headers: dbHeaders })
          const events = await eventResp.json()
          if (events?.[0]) {
            const newVal = (events[0][updateField] || 0) + qty
            await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${ed}`, {
              method: "PATCH", headers: dbHeaders,
              body: JSON.stringify({ [updateField]: newVal }),
            })
          }
        }
      }

      // Mark table as booked if table ticket
      if (tt.includes("couch") || tt.includes("high_top")) {
        const tableId = session.metadata?.table_id
        if (tableId) {
          const [tType, tNum] = tableId.match(/^(couch|high_top)_(\d+)$/)?.slice(1) || []
          const dbSlot = session.metadata?.time_slot === "before" ? "before_midnight"
            : session.metadata?.time_slot === "after" ? "after_midnight" : null

          const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${ed}&select=id`, { headers: dbHeaders })
          const evData = await evResp.json()
          if (evData?.[0]?.id && tType && tNum) {
            // Full-night booking (no time_slot): mark ALL slots for this table as booked
            let tableQuery = `${SUPABASE_URL}/rest/v1/vip_tables?event_id=eq.${evData[0].id}&table_type=eq.${tType}&table_number=eq.${tNum}`
            if (dbSlot) tableQuery += `&time_slot=eq.${dbSlot}`
            await fetch(tableQuery, {
              method: "PATCH", headers: dbHeaders,
              body: JSON.stringify({ status: "booked" }),
            })
          }
        }
      }
    }

    // Send QR ticket email (skip merch orders — no ticket_type)
    if (ticket.customer_email && ticket.ticket_type) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          customer_email: ticket.customer_email,
          customer_name: ticket.customer_name,
          ticket_type: ticket.ticket_type,
          event_date: ticket.event_date,
        }),
      })
    } catch (_) {
      // Don't block ticket display if email fails
    }
    }
    } // end alreadyProcessed check
  }

  return new Response(JSON.stringify(ticket), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
