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
    const { event_date, customer_name, customer_email, customer_phone, claim_type, quantity, visitor_id } = await req.json()
    const type = claim_type || "ladies_free"
    const qty = Math.max(parseInt(quantity) || 1, 1)

    const logFailed = async (reason: string) => {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/failed_claims`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ event_date, customer_name, customer_email, customer_phone, claim_type: type, quantity: qty, reason }),
        })
      } catch (_e) { /* logging must never block the claim flow */ }
    }

    if (!event_date || !customer_name || !customer_phone) {
      await logFailed("missing_fields")
      return new Response(JSON.stringify({ error: "Name, phone, and event date required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get event
    const eventResp = await fetch(`${SUPABASE_URL}/rest/v1/events?event_date=eq.${event_date}&select=*`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    })
    const events = await eventResp.json()
    if (!events[0]) {
      await logFailed("event_not_found")
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const evt = events[0]

    // Check capacity based on claim type (accounting for quantity)
    if (type === "day_free") {
      if ((evt.day_free_claimed || 0) + qty > (evt.day_free_capacity || 0)) {
        await logFailed("capacity_full")
        return new Response(JSON.stringify({ error: "Not enough free day party tickets remaining" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    } else if (type === "day_ladies_free") {
      if ((evt.day_ladies_free_claimed || 0) + qty > (evt.day_ladies_free_capacity || 0)) {
        await logFailed("capacity_full")
        return new Response(JSON.stringify({ error: "Not enough free ladies day party tickets remaining" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    } else if (type === "dance_ga_free") {
      if (evt.free_ga_claimed + qty > evt.free_ga_capacity) {
        await logFailed("capacity_full")
        return new Response(JSON.stringify({ error: "Not enough free GA tickets remaining" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    } else {
      if (evt.ladies_free_claimed + qty > evt.ladies_free_capacity) {
        await logFailed("capacity_full")
        return new Response(JSON.stringify({ error: "Not enough free tickets remaining" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    // Determine booking type
    const bookingType = type === "dance_ga_free" ? "dance_ga_free" : type === "day_free" ? "day_free" : type === "day_ladies_free" ? "day_ladies_free" : "ladies_free"

    // Check for duplicate (same email or phone for this event)
    const dupResp = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?event_id=eq.${evt.id}&booking_type=eq.${bookingType}&status=neq.cancelled&or=(customer_email.eq.${encodeURIComponent(customer_email)},customer_phone.eq.${encodeURIComponent(customer_phone)})&select=id`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    )
    const dups = await dupResp.json()
    if (dups.length > 0) {
      await logFailed("duplicate")
      return new Response(JSON.stringify({ error: "You already claimed a free ticket for this event" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create booking
    const bookingResp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        event_id: evt.id,
        booking_type: bookingType,
        customer_name,
        customer_email: customer_email || null, // email is now optional (phone-only RSVP)
        customer_phone,
        party_size: qty,
        amount_paid: 0,
        status: "confirmed",
        // Click→RSVP attribution. Optional: older clients omit it, column is nullable.
        visitor_id: visitor_id || null,
      }),
    })
    const bookings = await bookingResp.json()
    const bookingId = bookings?.[0]?.id || null

    // Increment the appropriate counter
    let counterUpdate: Record<string, number>
    if (type === "day_free") {
      counterUpdate = { day_free_claimed: (evt.day_free_claimed || 0) + qty }
    } else if (type === "day_ladies_free") {
      counterUpdate = { day_ladies_free_claimed: (evt.day_ladies_free_claimed || 0) + qty }
    } else if (type === "dance_ga_free") {
      counterUpdate = { free_ga_claimed: evt.free_ga_claimed + qty }
    } else {
      counterUpdate = { ladies_free_claimed: evt.ladies_free_claimed + qty }
    }

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

    // Send the confirmation email with the door-scan QR. The frontend already shows the
    // QR on screen, so email is supplementary: a failure here must never fail the claim.
    // send-ticket-email embeds session_id verbatim into the QR, so free_<id> produces the
    // correct ?verify=free_<id> door URL. One login per claim — organic claims are spaced
    // out and never hit Gmail's login-frequency throttle.
    if (bookingId && customer_email) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: `free_${bookingId}`,
            customer_email,
            customer_name,
            ticket_type: bookingType,
            event_date,
          }),
        })
      } catch (_e) { /* email is best-effort; on-screen QR remains the source of truth */ }
    }

    let capacity: number, claimed: number
    if (type === "day_free") { capacity = evt.day_free_capacity || 0; claimed = evt.day_free_claimed || 0 }
    else if (type === "day_ladies_free") { capacity = evt.day_ladies_free_capacity || 0; claimed = evt.day_ladies_free_claimed || 0 }
    else if (type === "dance_ga_free") { capacity = evt.free_ga_capacity; claimed = evt.free_ga_claimed }
    else { capacity = evt.ladies_free_capacity; claimed = evt.ladies_free_claimed }

    return new Response(JSON.stringify({
      status: "confirmed",
      message: "Free ticket claimed!",
      remaining: capacity - claimed - qty,
      booking_id: bookingId,
      ticket_type: bookingType,
      event_date,
      customer_name,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
