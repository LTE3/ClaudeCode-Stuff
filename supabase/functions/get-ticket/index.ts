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

  return new Response(JSON.stringify(ticket), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
