Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")
    const { admin_password } = await req.json()

    // Simple password check (same as admin page)
    if (!admin_password) {
      return new Response(JSON.stringify({ error: "Password required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verify password via Supabase RPC
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!

    const authResp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_signup_count`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ admin_password }),
    })

    if (!authResp.ok) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch paid checkout sessions from Stripe
    const encoder = new TextEncoder()
    const credentials = encoder.encode(STRIPE_SK + ":")
    const base64 = btoa(String.fromCharCode(...credentials))

    const stripeResp = await fetch(
      "https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete&expand[]=data.line_items",
      {
        headers: { "Authorization": "Basic " + base64 },
      }
    )

    const sessions = await stripeResp.json()

    const orders = (sessions.data || [])
      .filter((s: any) => s.payment_status === "paid")
      .map((s: any) => ({
        email: s.customer_details?.email || "N/A",
        name: s.customer_details?.name || "N/A",
        amount: s.amount_total / 100,
        items: (s.line_items?.data || []).map((i: any) => ({
          name: i.description,
          qty: i.quantity,
          price: i.amount_total / 100,
        })),
        shipping: s.shipping_details?.address
          ? `${s.shipping_details.address.line1}${s.shipping_details.address.line2 ? ' ' + s.shipping_details.address.line2 : ''}, ${s.shipping_details.address.city}, ${s.shipping_details.address.state} ${s.shipping_details.address.postal_code}`
          : s.customer_details?.address?.line1
          ? `${s.customer_details.address.line1}${s.customer_details.address.line2 ? ' ' + s.customer_details.address.line2 : ''}, ${s.customer_details.address.city}, ${s.customer_details.address.state} ${s.customer_details.address.postal_code}`
          : null,
        date: new Date(s.created * 1000).toISOString(),
      }))

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.amount, 0)
    const totalOrders = orders.length
    const itemCounts: Record<string, number> = {}
    orders.forEach((o: any) => {
      o.items.forEach((i: any) => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty
      })
    })

    return new Response(JSON.stringify({
      totalRevenue,
      totalOrders,
      itemCounts,
      orders,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
