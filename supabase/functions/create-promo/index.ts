Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
  const encoder = new TextEncoder()
  const credentials = encoder.encode(STRIPE_SK + ":")
  const base64 = btoa(String.fromCharCode(...credentials))
  const stripeHeaders = {
    "Authorization": "Basic " + base64,
    "Content-Type": "application/x-www-form-urlencoded",
  }

  const { code, percent_off, action } = await req.json().catch(() => ({ code: 'BUNNY', percent_off: 95 }))
  const results: string[] = []

  try {
    // Deactivate existing promos with this code
    const listPromos = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${code}&active=true`, { headers: stripeHeaders })
    const promoList = await listPromos.json()
    for (const p of (promoList.data || [])) {
      await fetch(`https://api.stripe.com/v1/promotion_codes/${p.id}`, {
        method: "POST", headers: stripeHeaders, body: "active=false",
      })
      results.push(`Deactivated: ${p.id}`)
    }

    // Create coupon
    const couponBody = new URLSearchParams()
    couponBody.append("percent_off", String(percent_off || 95))
    couponBody.append("duration", "once")
    couponBody.append("name", `${code} ${percent_off || 95}% Off`)

    const couponResp = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST", headers: stripeHeaders, body: couponBody.toString(),
    })
    const coupon = await couponResp.json()
    results.push(`Coupon: ${coupon.id} - ${coupon.percent_off}%`)

    // Create promo code
    const promoBody = new URLSearchParams()
    promoBody.append("coupon", coupon.id)
    promoBody.append("code", code)
    promoBody.append("active", "true")

    const promoResp = await fetch("https://api.stripe.com/v1/promotion_codes", {
      method: "POST", headers: stripeHeaders, body: promoBody.toString(),
    })
    const promo = await promoResp.json()
    results.push(`Promo: ${promo.code} - active: ${promo.active}`)

    return new Response(JSON.stringify({ results, coupon, promo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, results }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
