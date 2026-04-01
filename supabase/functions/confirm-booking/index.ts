Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const { session_id } = await req.json()

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verify payment with Stripe
    const encoder = new TextEncoder()
    const credentials = encoder.encode(STRIPE_SK + ":")
    const base64 = btoa(String.fromCharCode(...credentials))

    const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { "Authorization": "Basic " + base64 },
    })
    const session = await stripeResp.json()

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const bookingId = session.metadata?.booking_id
    const eventDate = session.metadata?.event_date
    const ticketType = session.metadata?.ticket_type
    const tableId = session.metadata?.table_id

    if (!bookingId) {
      return new Response(JSON.stringify({ status: "no_booking", message: "No booking to confirm (merch order)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update booking status
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        status: "confirmed",
        stripe_session_id: session_id,
        stripe_payment_status: "paid",
        customer_name: session.customer_details?.name || "Unknown",
        customer_email: session.customer_details?.email || "",
      }),
    })

    // Update table status if VIP table booking
    if (tableId) {
      await fetch(`${SUPABASE_URL}/rest/v1/vip_tables?id=eq.${tableId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          status: "booked",
          booking_id: bookingId,
          held_until: null,
        }),
      })
    }

    // Increment sold count for GA/VIP GA
    if (ticketType === "ga" || ticketType === "vip_ga") {
      const field = ticketType === "ga" ? "ga_sold" : "vip_ga_sold"
      // Get current count and increment
      const eventResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${eventDate}&select=${field}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      })
      const eventData = await eventResp.json()
      if (eventData[0]) {
        const newCount = (eventData[0][field] || 0) + (session.metadata?.quantity ? parseInt(session.metadata.quantity) : 1)
        await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${eventDate}`, {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ [field]: newCount }),
        })
      }
    }

    return new Response(JSON.stringify({ status: "confirmed", booking_id: bookingId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
