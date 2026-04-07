Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const { query } = await req.json()
  if (!query || query.length < 4) {
    return new Response(JSON.stringify({ error: "Enter your email, phone, or name" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))

  const results: any[] = []
  const searchLower = query.toLowerCase().trim()
  const searchDigits = query.replace(/\D/g, "")

  // 1. Search Stripe for paid orders
  // Search by email if it looks like email
  if (searchLower.includes("@")) {
    const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions?limit=50&status=complete&customer_details[email]=${encodeURIComponent(searchLower)}`, {
      headers: { "Authorization": "Basic " + base64 },
    })
    const data = await resp.json()
    for (const s of (data.data || [])) {
      if (s.payment_status !== "paid") continue
      results.push({
        type: "paid",
        session_id: s.id,
        name: s.metadata?.customer_name || s.customer_details?.name || "",
        email: s.customer_details?.email || "",
        ticket_type: s.metadata?.ticket_type || "",
        event_date: s.metadata?.event_date || "",
        amount: s.amount_total ? s.amount_total / 100 : 0,
        date: new Date(s.created * 1000).toISOString(),
        items: s.line_items?.data?.map((i: any) => i.description) || [],
      })
    }
  }

  // Also search by expanding results if no email match
  if (results.length === 0) {
    // Search recent sessions and filter by name/phone
    let allSessions: any[] = []
    let hasMore = true
    let startingAfter = ""
    let pages = 0

    while (hasMore && pages < 3) {
      let url = "https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete"
      if (startingAfter) url += "&starting_after=" + startingAfter
      const resp = await fetch(url, { headers: { "Authorization": "Basic " + base64 } })
      const page = await resp.json()
      allSessions = allSessions.concat(page.data || [])
      hasMore = page.has_more || false
      if (page.data?.length > 0) startingAfter = page.data[page.data.length - 1].id
      pages++
    }

    for (const s of allSessions) {
      if (s.payment_status !== "paid") continue
      const email = (s.customer_details?.email || "").toLowerCase()
      const name = (s.metadata?.customer_name || s.customer_details?.name || "").toLowerCase()
      const phone = (s.metadata?.customer_phone || "").replace(/\D/g, "")

      let match = false
      if (searchLower.includes("@") && email === searchLower) match = true
      else if (searchDigits.length >= 7 && phone.includes(searchDigits)) match = true
      else if (searchDigits.length >= 7 && phone.endsWith(searchDigits)) match = true
      else if (!searchLower.includes("@") && searchDigits.length < 7 && name.includes(searchLower)) match = true
      else if (email.includes(searchLower)) match = true

      if (match) {
        results.push({
          type: s.shipping_details ? "merch" : "paid",
          session_id: s.id,
          name: s.metadata?.customer_name || s.customer_details?.name || "",
          email: s.customer_details?.email || "",
          ticket_type: s.metadata?.ticket_type || "",
          event_date: s.metadata?.event_date || "",
          amount: s.amount_total ? s.amount_total / 100 : 0,
          date: new Date(s.created * 1000).toISOString(),
          shipping: s.shipping_details?.address ? `${s.shipping_details.address.line1}, ${s.shipping_details.address.city}, ${s.shipping_details.address.state} ${s.shipping_details.address.postal_code}` : null,
        })
      }
    }
  }

  // 2. Search bookings (free tickets)
  const dbHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }

  let bookingQuery = `${SUPABASE_URL}/rest/v1/bookings?status=eq.confirmed&select=id,customer_name,customer_email,customer_phone,booking_type,event_id,party_size,created_at&or=(`
  if (searchLower.includes("@")) {
    bookingQuery += `customer_email.ilike.%25${searchLower}%25)`
  } else if (searchDigits.length >= 7) {
    bookingQuery += `customer_phone.like.%25${searchDigits}%25)`
  } else {
    bookingQuery += `customer_name.ilike.%25${searchLower}%25)`
  }

  const bResp = await fetch(bookingQuery, { headers: dbHeaders })
  const bookings = await bResp.json()

  for (const b of (bookings || [])) {
    // Get event date
    const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${b.event_id}&select=event_date`, { headers: dbHeaders })
    const evData = await evResp.json()

    results.push({
      type: "free",
      booking_id: b.id,
      name: b.customer_name,
      email: b.customer_email,
      ticket_type: b.booking_type,
      event_date: evData?.[0]?.event_date || "",
      amount: 0,
      date: b.created_at,
    })
  }

  return new Response(JSON.stringify({ results, count: results.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
