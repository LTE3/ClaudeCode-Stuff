Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const { admin_password, offset = 0, batch_size = 30 } = await req.json()
  if (admin_password !== "DannyManny21") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))

  // Get all paid sessions from Stripe
  let allSessions: any[] = []
  let hasMore = true
  let startingAfter = ""

  while (hasMore) {
    let url = "https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete"
    if (startingAfter) url += "&starting_after=" + startingAfter

    const resp = await fetch(url, {
      headers: { "Authorization": "Basic " + base64 },
    })
    const page = await resp.json()
    allSessions = allSessions.concat(page.data || [])
    hasMore = page.has_more || false
    if (page.data?.length > 0) startingAfter = page.data[page.data.length - 1].id
  }

  const allPaid = allSessions.filter((s: any) => {
    if (s.payment_status !== "paid") return false
    // Skip merch orders (they have shipping but no ticket_type metadata)
    if (s.shipping_details && !s.metadata?.ticket_type) return false
    // Skip if line items contain merch keywords
    const itemName = s.line_items?.data?.[0]?.description || ""
    if (itemName.match(/Tee|Keychain|Tote|Hat|Shirt|Hoodie|Bag/i)) return false
    return true
  })
  const paidSessions = allPaid.slice(offset, offset + batch_size)
  const results: string[] = []
  let sent = 0
  let failed = 0

  for (const session of paidSessions) {
    const email = session.customer_details?.email
    if (!email) continue

    const ticketType = session.metadata?.ticket_type || "ga_tier1"
    const eventDate = session.metadata?.event_date || ""
    const customerName = session.metadata?.customer_name || session.customer_details?.name || ""

    try {
      const emailResp = await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          customer_email: email,
          customer_name: customerName,
          ticket_type: ticketType,
          event_date: eventDate,
        }),
      })
      const emailData = await emailResp.json()
      if (emailData.success) {
        sent++
      } else {
        failed++
        results.push(`Failed: ${email} — ${emailData.error}`)
      }
    } catch (e) {
      failed++
    }

    // Rate limit — 1 per second to avoid Gmail throttling
    await new Promise(r => setTimeout(r, 1500))
  }

  return new Response(JSON.stringify({ sent, failed, total: allPaid.length, batch_offset: offset, batch_size, next_offset: offset + batch_size, errors: results.slice(0, 10) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
