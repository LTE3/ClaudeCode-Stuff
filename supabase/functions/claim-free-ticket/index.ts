Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const { event_date, customer_name, customer_email, customer_phone, claim_type } = await req.json()
    const type = claim_type || "ladies_free"

    if (!event_date || !customer_name || !customer_email || !customer_phone) {
      return new Response(JSON.stringify({ error: "Name, email, phone, and event date required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get event
    const eventResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${event_date}&select=*`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    })
    const events = await eventResp.json()
    if (!events[0]) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const evt = events[0]

    // Check capacity based on claim type
    if (type === "dance_ga_free") {
      if (evt.free_ga_claimed >= evt.free_ga_capacity) {
        return new Response(JSON.stringify({ error: "Free GA tickets are sold out" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    } else {
      if (evt.ladies_free_claimed >= evt.ladies_free_capacity) {
        return new Response(JSON.stringify({ error: "Free tickets are sold out" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    // Determine booking type
    const bookingType = type === "dance_ga_free" ? "dance_ga_free" : "ladies_free"

    // Check for duplicate (same email or phone for this event)
    const dupResp = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?event_id=eq.${evt.id}&booking_type=eq.${bookingType}&status=neq.cancelled&or=(customer_email.eq.${encodeURIComponent(customer_email)},customer_phone.eq.${encodeURIComponent(customer_phone)})&select=id`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    )
    const dups = await dupResp.json()
    if (dups.length > 0) {
      return new Response(JSON.stringify({ error: "You already claimed a free ticket for this event" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create booking
    await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        event_id: evt.id,
        booking_type: bookingType,
        customer_name,
        customer_email,
        customer_phone,
        party_size: 1,
        amount_paid: 0,
        status: "confirmed",
      }),
    })

    // Increment the appropriate counter
    const counterUpdate = type === "dance_ga_free"
      ? { free_ga_claimed: evt.free_ga_claimed + 1 }
      : { ladies_free_claimed: evt.ladies_free_claimed + 1 }

    await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${evt.id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(counterUpdate),
    })

    const capacity = type === "dance_ga_free" ? evt.free_ga_capacity : evt.ladies_free_capacity
    const claimed = type === "dance_ga_free" ? evt.free_ga_claimed : evt.ladies_free_claimed

    return new Response(JSON.stringify({
      status: "confirmed",
      message: "Free ticket claimed!",
      remaining: capacity - claimed - 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
