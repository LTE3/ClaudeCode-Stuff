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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const sbHeaders = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    }

    // Staff management
    if (action === "get_staff") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/staff?order=name.asc`, { headers: sbHeaders })
      const staff = await r.json()
      return new Response(JSON.stringify({ staff: staff || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "add_staff") {
      const { name, role, phone } = data
      if (!name || !role) {
        return new Response(JSON.stringify({ error: "name and role required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/staff`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify({ name, role, phone: phone || "" }),
      })
      const inserted = await r.json()
      return new Response(JSON.stringify({ success: true, staff: inserted?.[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "update_staff") {
      const { staff_id, updates } = data
      if (!staff_id || !updates) {
        return new Response(JSON.stringify({ error: "staff_id and updates required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/staff?id=eq.${staff_id}`, {
        method: "PATCH",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(updates),
      })
      const updated = await r.json()
      return new Response(JSON.stringify({ success: true, staff: updated?.[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "delete_staff") {
      const { staff_id } = data
      await fetch(`${SUPABASE_URL}/rest/v1/staff?id=eq.${staff_id}`, {
        method: "DELETE", headers: sbHeaders,
      })
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Schedules
    if (action === "get_schedule") {
      const { party_date, staff_name } = data
      let url = `${SUPABASE_URL}/rest/v1/schedules?order=party_date.asc,staff_name.asc`
      if (party_date) url += `&party_date=eq.${party_date}`
      if (staff_name) url += `&staff_name=eq.${encodeURIComponent(staff_name)}`
      const r = await fetch(url, { headers: sbHeaders })
      const schedules = await r.json()
      return new Response(JSON.stringify({ schedules: schedules || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "set_schedule") {
      const { entries } = data
      if (!entries?.length) {
        return new Response(JSON.stringify({ error: "entries required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      // Delete existing for those dates then insert
      const dates = [...new Set(entries.map((e: any) => e.party_date))]
      for (const d of dates) {
        await fetch(`${SUPABASE_URL}/rest/v1/schedules?party_date=eq.${d}`, {
          method: "DELETE", headers: sbHeaders,
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(entries),
      })
      const inserted = await r.json()
      return new Response(JSON.stringify({ success: true, count: inserted?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Save tip payouts
    if (action === "save_payouts") {
      const { payouts } = data
      if (!payouts?.length) {
        return new Response(JSON.stringify({ error: "payouts required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tip_payouts`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(payouts),
      })
      const inserted = await r.json()
      return new Response(JSON.stringify({ success: true, count: inserted?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get tip payouts for a staff member or date
    if (action === "get_payouts") {
      const { staff_name, party_date } = data
      let url = `${SUPABASE_URL}/rest/v1/tip_payouts?order=party_date.desc`
      if (staff_name) url += `&staff_name=eq.${encodeURIComponent(staff_name)}`
      if (party_date) url += `&party_date=eq.${party_date}`
      const r = await fetch(url, { headers: sbHeaders })
      const payouts = await r.json()
      return new Response(JSON.stringify({ payouts: payouts || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Clock in
    if (action === "clock_in") {
      const { name, role, party_date } = data
      if (!name || !role || !party_date) {
        return new Response(JSON.stringify({ error: "name, role, party_date required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/clock_records`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify({ name, role, party_date }),
      })
      const inserted = await r.json()
      return new Response(JSON.stringify({ success: true, record: inserted?.[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Clock out
    if (action === "clock_out") {
      const { record_id } = data
      if (!record_id) {
        return new Response(JSON.stringify({ error: "record_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      // Get the record to calculate hours
      const getR = await fetch(`${SUPABASE_URL}/rest/v1/clock_records?id=eq.${record_id}`, { headers: sbHeaders })
      const records = await getR.json()
      if (!records?.length) {
        return new Response(JSON.stringify({ error: "record not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const clockIn = new Date(records[0].clock_in)
      const clockOut = new Date()
      const hours = Math.round((clockOut.getTime() - clockIn.getTime()) / 1000 / 60 / 30) / 2 // round to nearest 0.5

      const r = await fetch(`${SUPABASE_URL}/rest/v1/clock_records?id=eq.${record_id}`, {
        method: "PATCH",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify({ clock_out: clockOut.toISOString(), hours }),
      })
      const updated = await r.json()
      return new Response(JSON.stringify({ success: true, record: updated?.[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get clock records for a date
    if (action === "clock_records") {
      const { party_date } = data
      if (!party_date) {
        return new Response(JSON.stringify({ error: "party_date required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/clock_records?party_date=eq.${party_date}&order=clock_in.asc`, { headers: sbHeaders })
      const records = await r.json()
      return new Response(JSON.stringify({ records: records || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Cash payment: log to Supabase
    if (action === "cash") {
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

      const cashRow = {
        items: itemDesc,
        subtotal, tax, service_charge: serviceCharge,
        tip: data.tip || 0,
        total: total + (data.tip || 0),
        staff: data.staff || "",
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/cash_transactions`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(cashRow),
      })
      const inserted = await r.json()

      return new Response(JSON.stringify({
        success: true,
        subtotal, tax, service_charge: serviceCharge, total,
        cash_id: inserted?.[0]?.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Tips dashboard: return terminal payments with tip breakdown
    if (action === "tips") {
      // Paginate through all recent payments (last 7 days)
      const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400
      let allPIs: any[] = []
      let startingAfter = ""
      for (let page = 0; page < 50; page++) {
        const url = `https://api.stripe.com/v1/payment_intents?limit=100&created[gte]=${weekAgo}` + (startingAfter ? `&starting_after=${startingAfter}` : "")
        const resp = await fetch(url, { headers: { "Authorization": auth } })
        const data = await resp.json()
        const items = data.data || []
        if (!items.length) break
        allPIs = allPIs.concat(items)
        if (!data.has_more) break
        startingAfter = items[items.length - 1].id
      }

      // Include all succeeded payments that have service_charge metadata (terminal + QR pay)
      const filtered = allPIs.filter((pi: any) => pi.status === "succeeded" && pi.metadata?.service_charge)

      const results = filtered.map((pi: any) => {
        const subtotal = parseInt(pi.metadata?.subtotal || "0")
        const tax = parseInt(pi.metadata?.tax || "0")
        const serviceCharge = parseInt(pi.metadata?.service_charge || "0")
        const baseTotal = subtotal + tax + serviceCharge
        const tip = pi.amount - baseTotal
        const isTerminal = pi.payment_method_types?.includes("card_present")
        return {
          id: pi.id,
          created: pi.created,
          items: pi.metadata?.items || "N/A",
          subtotal, tax, service_charge: serviceCharge,
          tip: tip > 0 ? tip : 0,
          total: pi.amount,
          source: isTerminal ? "terminal" : "qr",
        }
      })

      // Also fetch cash transactions from Supabase
      const weekAgoISO = new Date(weekAgo * 1000).toISOString()
      const cashResp = await fetch(`${SUPABASE_URL}/rest/v1/cash_transactions?created_at=gte.${weekAgoISO}&order=created_at.desc`, {
        headers: sbHeaders,
      })
      const cashRows = await cashResp.json()
      if (Array.isArray(cashRows)) {
        for (const c of cashRows) {
          results.push({
            id: c.id,
            created: Math.floor(new Date(c.created_at).getTime() / 1000),
            items: c.items || "N/A",
            subtotal: c.subtotal,
            tax: c.tax,
            service_charge: c.service_charge,
            tip: c.tip || 0,
            total: c.total,
            source: "cash",
          })
        }
      }

      results.sort((a: any, b: any) => b.created - a.created)

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
