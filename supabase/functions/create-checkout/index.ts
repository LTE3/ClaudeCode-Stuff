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
    const data = await req.json()

    const body = new URLSearchParams()
    body.append("mode", "payment")
    body.append("success_url", "https://lacasitabk.com/?purchased=true")
    body.append("cancel_url", "https://lacasitabk.com/")
    body.append("payment_method_types[0]", "card")

    // ─── Multi-item cart checkout (merch) ───
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any, i: number) => {
        body.append(`line_items[${i}][price_data][currency]`, "usd")
        body.append(`line_items[${i}][price_data][product_data][name]`, item.name)
        body.append(`line_items[${i}][price_data][unit_amount]`, String(item.amount))
        body.append(`line_items[${i}][quantity]`, String(item.qty || 1))
      })
      body.append("shipping_address_collection[allowed_countries][0]", "US")
    }

    // ─── Ticket purchase (event-aware) ───
    else if (data.ticket_type) {
      const ticketPrices: Record<string, { amount: number; name: string }> = {
        ga: { amount: 2000, name: "La Casita BK - General Admission ($15 + $5 fee)" },
        vip_ga: { amount: 4000, name: "La Casita BK - VIP GA ($35 + $5 fee)" },
        vip_couch_before: { amount: 10000, name: "VIP Couch Deposit - Before Midnight (10pm-1am)" },
        vip_couch_after: { amount: 10000, name: "VIP Couch Deposit - After Midnight (1am-4am)" },
        vip_high_top_before: { amount: 5000, name: "VIP High Top Deposit - Before Midnight (10pm-1am)" },
        vip_high_top_after: { amount: 5000, name: "VIP High Top Deposit - After Midnight (1am-4am)" },
        // Regular (non-VIP) table deposits
        regular_couch_before: { amount: 10000, name: "Regular Couch (DTMF) — Before Midnight" },
        regular_couch_after: { amount: 10000, name: "Regular Couch (DTMF) — After Midnight" },
        regular_high_top: { amount: 5000, name: "Regular High Top (Verano)" },
        // Dance night paid GA
        dance_ga: { amount: 2000, name: "Dance Night GA ($15 + $5 fee)" },
        // Season passes
        season_pass_regular: { amount: 9900, name: "Bad Bunny Season Pass — All Access" },
        season_pass_vip: { amount: 24900, name: "VIP Season Pass — All Access VIP" },
        test_ticket: { amount: 100, name: "Test Ticket ($1)" },
      }

      const selected = ticketPrices[data.ticket_type]
      if (!selected) {
        return new Response(JSON.stringify({ error: "Invalid ticket type" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Check availability if event_date provided
      if (data.event_date && SUPABASE_URL && SUPABASE_KEY) {
        const availResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_event_availability`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_event_date: data.event_date }),
        })
        const avail = await availResp.json()

        if (avail.error) {
          return new Response(JSON.stringify({ error: avail.error }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          })
        }

        // Check GA capacity
        if (data.ticket_type === "ga" && avail.ga_sold >= avail.ga_capacity) {
          return new Response(JSON.stringify({ error: "GA tickets sold out" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          })
        }

        // Check VIP GA capacity
        if (data.ticket_type === "vip_ga" && avail.vip_ga_sold >= avail.vip_ga_capacity) {
          return new Response(JSON.stringify({ error: "VIP GA tickets sold out" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          })
        }

        // Check table availability and place hold
        if (data.table_id && (data.ticket_type.startsWith("vip_couch") || data.ticket_type.startsWith("vip_high_top") || data.ticket_type.startsWith("regular_couch") || data.ticket_type.startsWith("regular_high_top"))) {
          const tableCheck = avail.tables?.find((t: any) => t.id === data.table_id)
          if (!tableCheck || tableCheck.status !== "available") {
            return new Response(JSON.stringify({ error: "This table is no longer available" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
          }

          // Place 10-minute hold
          await fetch(`${SUPABASE_URL}/rest/v1/vip_tables?id=eq.${data.table_id}`, {
            method: "PATCH",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              status: "held",
              held_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            }),
          })
        }

        // Create booking record
        const bookingType = data.ticket_type.startsWith("vip_couch") ? "vip_couch"
          : data.ticket_type.startsWith("vip_high_top") ? "vip_high_top"
          : data.ticket_type.startsWith("regular_couch") ? "regular_couch"
          : data.ticket_type === "regular_high_top" ? "regular_high_top"
          : data.ticket_type.startsWith("season_pass_") ? "season_pass"
          : data.ticket_type === "test_ticket" ? "test"
          : data.ticket_type

        const booking = {
          event_id: avail.event_id,
          booking_type: bookingType,
          customer_name: data.customer_name || "Pending",
          customer_email: data.customer_email || "pending@checkout.com",
          customer_phone: data.customer_phone || null,
          party_size: data.party_size || 1,
          table_id: data.table_id || null,
          time_slot: data.time_slot || null,
          amount_paid: selected.amount,
          deposit_amount: selected.amount,
          bottle_package: data.bottle_package || null,
          status: "pending",
        }

        const bookingResp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
          },
          body: JSON.stringify(booking),
        })
        const bookingData = await bookingResp.json()
        const bookingId = bookingData[0]?.id

        // Add booking ID to Stripe metadata
        body.append("metadata[booking_id]", bookingId || "")
        body.append("metadata[event_date]", data.event_date)
        body.append("metadata[ticket_type]", data.ticket_type)
        if (data.table_id) body.append("metadata[table_id]", data.table_id)
      }

      // Add line item
      const itemName = data.event_date
        ? `${selected.name} — ${data.event_date}`
        : selected.name

      body.append("line_items[0][price_data][currency]", "usd")
      body.append("line_items[0][price_data][product_data][name]", itemName)
      body.append("line_items[0][price_data][unit_amount]", String(selected.amount))
      body.append("line_items[0][quantity]", String(data.quantity || 1))

      // Collect email for receipts
      if (data.customer_email && data.customer_email !== "pending@checkout.com") {
        body.append("customer_email", data.customer_email)
      }
    }

    // ─── Legacy single-tier tickets (backward compat) ───
    else if (data.tier) {
      const legacyPrices: Record<string, { amount: number; name: string }> = {
        ga: { amount: 3500, name: "La Casita BK - General Admission" },
        vip: { amount: 7500, name: "La Casita BK - VIP Experience" },
        tables: { amount: 25000, name: "La Casita BK - Private Table" },
        test_item: { amount: 100, name: "Test Item" },
      }
      const selected = legacyPrices[data.tier]
      if (!selected) {
        return new Response(JSON.stringify({ error: "Invalid tier" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      body.append("line_items[0][price_data][currency]", "usd")
      body.append("line_items[0][price_data][product_data][name]", selected.name)
      body.append("line_items[0][price_data][unit_amount]", String(selected.amount))
      body.append("line_items[0][quantity]", "1")
    }

    else {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create Stripe checkout session
    const encoder = new TextEncoder()
    const credentials = encoder.encode(STRIPE_SK + ":")
    const base64 = btoa(String.fromCharCode(...credentials))

    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + base64,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    const session = await stripeResp.json()

    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create season pass record if applicable
    if (data.ticket_type?.startsWith("season_pass_")) {
      await fetch(`${SUPABASE_URL}/rest/v1/season_passes`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          pass_type: data.ticket_type === "season_pass_vip" ? "vip" : "regular",
          customer_name: data.customer_name || "Pending",
          customer_email: data.customer_email || "pending@checkout.com",
          customer_phone: data.customer_phone || null,
          stripe_session_id: session.id,
        }),
      })
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
