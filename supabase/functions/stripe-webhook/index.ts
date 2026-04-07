Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const dbHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  }

  try {
    const body = await req.json()
    const event = body

    // Only handle checkout.session.completed
    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const session = event.data.object
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const ticketType = session.metadata?.ticket_type || ""
    const eventDate = session.metadata?.event_date || ""
    const qty = parseInt(session.metadata?.quantity || "1")
    const tableId = session.metadata?.table_id || ""
    const timeSlot = session.metadata?.time_slot || ""

    if (!eventDate || !ticketType) {
      return new Response(JSON.stringify({ received: true, skipped: "no metadata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Skip merch orders
    if (session.shipping_details && !ticketType) {
      return new Response(JSON.stringify({ received: true, skipped: "merch" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update sold count
    let updateField = ""
    if (ticketType.startsWith("ga_tier1")) updateField = "ga_tier1_sold"
    else if (ticketType.startsWith("ga_tier2")) updateField = "ga_tier2_sold"
    else if (ticketType.startsWith("ga_tier3")) updateField = "ga_tier3_sold"
    else if (ticketType === "vip_ga") updateField = "vip_ga_sold"
    else if (ticketType === "dance_ga") updateField = "ga_sold"

    if (updateField) {
      // Get current count
      const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${eventDate}&select=id,${updateField}`, { headers: dbHeaders })
      const events = await evResp.json()
      if (events?.[0]) {
        const newVal = (events[0][updateField] || 0) + qty
        await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${eventDate}`, {
          method: "PATCH", headers: dbHeaders,
          body: JSON.stringify({ [updateField]: newVal }),
        })
      }
    }

    // Mark table as booked
    if (tableId && (ticketType.includes("couch") || ticketType.includes("high_top"))) {
      const [tType, tNum] = tableId.match(/^(couch|high_top)_(\d+)$/)?.slice(1) || []
      const dbSlot = timeSlot === "before" ? "before_midnight" : timeSlot === "after" ? "after_midnight" : null

      const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${eventDate}&select=id`, { headers: dbHeaders })
      const evData = await evResp.json()
      if (evData?.[0]?.id && tType && tNum) {
        let tableQuery = `${SUPABASE_URL}/rest/v1/vip_tables?event_id=eq.${evData[0].id}&table_type=eq.${tType}&table_number=eq.${tNum}`
        if (dbSlot) tableQuery += `&time_slot=eq.${dbSlot}`
        await fetch(tableQuery, {
          method: "PATCH", headers: dbHeaders,
          body: JSON.stringify({ status: "booked" }),
        })
      }
    }

    // Send QR ticket email
    const customerEmail = session.customer_details?.email || session.metadata?.customer_email
    const customerName = session.metadata?.customer_name || session.customer_details?.name || ""
    if (customerEmail) {
      await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          customer_email: customerEmail,
          customer_name: customerName,
          ticket_type: ticketType,
          event_date: eventDate,
        }),
      }).catch(() => {})
    }

    return new Response(JSON.stringify({ received: true, updated: updateField || "none", email: !!customerEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
