Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const { admin_password } = await req.json()
  if (admin_password !== "DannyManny21") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))
  const stripeHeaders = { "Authorization": "Basic " + base64 }

  const results: any = { open: [], expired: [] }

  // Check open (in progress) sessions
  const openResp = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=20&status=open", { headers: stripeHeaders })
  const openData = await openResp.json()
  for (const s of (openData.data || [])) {
    results.open.push({
      email: s.customer_details?.email || s.metadata?.customer_email || "unknown",
      ticket: s.metadata?.ticket_type || "unknown",
      date: s.metadata?.event_date || "",
      created: new Date(s.created * 1000).toISOString(),
      amount: s.amount_total ? s.amount_total / 100 : 0,
    })
  }

  // Check expired sessions
  const expResp = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=20&status=expired", { headers: stripeHeaders })
  const expData = await expResp.json()
  for (const s of (expData.data || [])) {
    results.expired.push({
      email: s.customer_details?.email || s.metadata?.customer_email || "unknown",
      ticket: s.metadata?.ticket_type || "unknown",
      date: s.metadata?.event_date || "",
      created: new Date(s.created * 1000).toISOString(),
      amount: s.amount_total ? s.amount_total / 100 : 0,
    })
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
