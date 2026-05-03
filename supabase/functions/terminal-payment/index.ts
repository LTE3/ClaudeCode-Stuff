Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const STRIPE_SK = Deno.env.get("STRIPE_SECRET_KEY")!
    const data = await req.json()

    const { reader_id, items, action } = data

    const auth = "Basic " + btoa(STRIPE_SK + ":")

    // Tips dashboard: return terminal payments with tip breakdown
    if (action === "tips") {
      const resp = await fetch("https://api.stripe.com/v1/payment_intents?limit=100", {
        headers: { "Authorization": auth },
      })
      const page = await resp.json()
      const allPIs = (page.data || []).filter((pi: any) => pi.payment_method_types?.includes("card_present") && pi.status === "succeeded")

      const results = allPIs.map((pi: any) => {
        const subtotal = parseInt(pi.metadata?.subtotal || "0")
        const tax = parseInt(pi.metadata?.tax || "0")
        const serviceCharge = parseInt(pi.metadata?.service_charge || "0")
        const baseTotal = subtotal + tax + serviceCharge
        const tip = pi.amount - baseTotal
        return {
          id: pi.id,
          created: pi.created,
          items: pi.metadata?.items || "N/A",
          subtotal, tax, service_charge: serviceCharge,
          tip: tip > 0 ? tip : 0,
          total: pi.amount,
        }
      })

      return new Response(JSON.stringify({ payments: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // QR Pay: create Checkout Session instead of terminal payment
    if (action === "qr") {
      if (!items?.length) {
        return new Response(JSON.stringify({ error: "items required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const SERVICE_CHARGE_RATE = 0.20
      const TAX_RATE = 0.09
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount * (item.qty || 1)), 0)
      const serviceBase = items.filter((i: any) => !i.noService).reduce((sum: number, item: any) => sum + (item.amount * (item.qty || 1)), 0)
      const tax = Math.round(subtotal * TAX_RATE)
      const serviceCharge = Math.round(serviceBase * SERVICE_CHARGE_RATE)
      const total = subtotal + tax + serviceCharge
      const itemDesc = items.map((i: any) => `${i.name} x${i.qty || 1}`).join(", ")

      const csBody = new URLSearchParams()
      csBody.append("mode", "payment")
      csBody.append("success_url", "https://lacasitabk.com/admin/pos.html?paid=true")
      csBody.append("line_items[0][price_data][currency]", "usd")
      csBody.append("line_items[0][price_data][product_data][name]", "La Casita BK — Food & Drinks")
      csBody.append("line_items[0][price_data][unit_amount]", String(total))
      csBody.append("line_items[0][quantity]", "1")
      csBody.append("payment_intent_data[description]", `La Casita BK Food: ${itemDesc} + 20% service charge`)
      csBody.append("payment_intent_data[statement_descriptor]", "LA CASITA BK FOOD")
      csBody.append("payment_intent_data[metadata][subtotal]", String(subtotal))
      csBody.append("payment_intent_data[metadata][tax]", String(tax))
      csBody.append("payment_intent_data[metadata][service_charge]", String(serviceCharge))
      csBody.append("payment_intent_data[metadata][items]", itemDesc)
      csBody.append("customer_email", "guest@lacasitabk.com")

      const csResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { "Authorization": auth, "Content-Type": "application/x-www-form-urlencoded" },
        body: csBody.toString(),
      })
      const cs = await csResp.json()

      if (cs.error) {
        return new Response(JSON.stringify({ error: cs.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        checkout_url: cs.url,
        subtotal,
        service_charge: serviceCharge,
        tax,
        total,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!reader_id) {
      return new Response(JSON.stringify({ error: "reader_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Void/cancel action on reader
    if (action === "void") {
      const cancelResp = await fetch(`https://api.stripe.com/v1/terminal/readers/${reader_id}/cancel_action`, {
        method: "POST",
        headers: { "Authorization": auth },
      })
      const cancelResult = await cancelResp.json()
      if (cancelResult.error) {
        return new Response(JSON.stringify({ error: cancelResult.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ success: true, message: "Payment canceled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!items?.length) {
      return new Response(JSON.stringify({ error: "items required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const SERVICE_CHARGE_RATE = 0.20
    const TAX_RATE = 0.09

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount * (item.qty || 1)), 0)
    const serviceBase = items.filter((i: any) => !i.noService).reduce((sum: number, item: any) => sum + (item.amount * (item.qty || 1)), 0)
    const tax = Math.round(subtotal * TAX_RATE)
    const serviceCharge = Math.round(serviceBase * SERVICE_CHARGE_RATE)
    const total = subtotal + tax + serviceCharge

    // Set reader display to show cart with line items on the S710 screen
    const displayBody = new URLSearchParams()
    displayBody.append("type", "cart")
    displayBody.append("cart[currency]", "usd")
    displayBody.append("cart[total]", String(total))
    displayBody.append("cart[tax]", String(tax))

    let idx = 0
    for (const item of items) {
      const qty = item.qty || 1
      displayBody.append(`cart[line_items][${idx}][description]`, item.name)
      displayBody.append(`cart[line_items][${idx}][amount]`, String(item.amount))
      displayBody.append(`cart[line_items][${idx}][quantity]`, String(qty))
      idx++
    }
    // Add service charge as visible line item
    displayBody.append(`cart[line_items][${idx}][description]`, "Service Charge (20%)")
    displayBody.append(`cart[line_items][${idx}][amount]`, String(serviceCharge))
    displayBody.append(`cart[line_items][${idx}][quantity]`, "1")

    await fetch(`https://api.stripe.com/v1/terminal/readers/${reader_id}/set_reader_display`, {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: displayBody.toString(),
    })

    // Create PaymentIntent with full item description
    const itemDesc = items.map((i: any) => `${i.name} x${i.qty || 1}`).join(", ")
    const piBody = new URLSearchParams()
    piBody.append("amount", String(total))
    piBody.append("currency", "usd")
    piBody.append("payment_method_types[0]", "card_present")
    piBody.append("capture_method", "automatic")
    piBody.append("description", `La Casita BK Food: ${itemDesc} + 20% service charge`)
    piBody.append("statement_descriptor", "LA CASITA BK FOOD")
    piBody.append("metadata[subtotal]", String(subtotal))
    piBody.append("metadata[tax]", String(tax))
    piBody.append("metadata[tax_rate]", "9%")
    piBody.append("metadata[service_charge]", String(serviceCharge))
    piBody.append("metadata[service_charge_rate]", "20%")
    piBody.append("metadata[items]", itemDesc)

    const piResp = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: piBody.toString(),
    })
    const pi = await piResp.json()

    if (pi.error) {
      return new Response(JSON.stringify({ error: pi.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Send to terminal reader
    const processBody = new URLSearchParams()
    processBody.append("payment_intent", pi.id)

    const processResp = await fetch(`https://api.stripe.com/v1/terminal/readers/${reader_id}/process_payment_intent`, {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: processBody.toString(),
    })
    const result = await processResp.json()

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      payment_intent: pi.id,
      subtotal,
      service_charge: serviceCharge,
      total,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
