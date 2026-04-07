Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))

  const body = new URLSearchParams()
  body.append("url", `${SUPABASE_URL}/functions/v1/stripe-webhook`)
  body.append("enabled_events[]", "checkout.session.completed")

  const resp = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + base64,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  const result = await resp.json()
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
