Deno.serve(async (_req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (_req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }

  const results: string[] = []

  let body: any = {}
  try { body = await _req.json() } catch {}

  if (body.action === "update_event" && body.event_id && body.updates) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${body.event_id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(body.updates),
    })
    const data = await r.json()
    return new Response(JSON.stringify({ updated: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (body.action === "insert_booking" && body.booking) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(body.booking),
    })
    const data = await r.json()
    return new Response(JSON.stringify({ inserted: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (body.action === "update_booking" && body.filter && body.updates) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?${body.filter}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(body.updates),
    })
    const data = await r.json()
    return new Response(JSON.stringify({ updated: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // 1. Release all holds
  const holdResp = await fetch(`${SUPABASE_URL}/rest/v1/vip_tables?status=eq.held`, {
    method: "PATCH",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({ status: "available", held_until: null }),
  })
  results.push(`Release holds: ${holdResp.status}`)

  // 2. Get all events
  const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id&is_active=eq.true`, { headers })
  const events = await evResp.json()
  results.push(`Events: ${events.length}`)

  // 3. Add regular tables for all events
  const rows: any[] = []
  for (const e of events) {
    for (const type of ["couch", "high_top"]) {
      for (const num of [5, 6, 7]) {
        for (const slot of ["before_midnight", "after_midnight"]) {
          rows.push({ event_id: e.id, table_type: type, table_number: num, time_slot: slot, status: "available", tier: "regular" })
        }
      }
    }
  }

  // Insert with ignore duplicates
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/vip_tables`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(batch),
    })
    results.push(`Batch ${Math.floor(i/50)+1}: ${r.status}`)
  }

  // 4. Delete test bookings
  const delResp = await fetch(`${SUPABASE_URL}/rest/v1/bookings?customer_email=eq.test@test.com`, {
    method: "DELETE",
    headers: { ...headers, "Prefer": "return=minimal" },
  })
  results.push(`Delete test bookings: ${delResp.status}`)

  // 5. Verify
  const verResp = await fetch(`${SUPABASE_URL}/rest/v1/vip_tables?event_id=eq.${events[0]?.id}&select=tier`, { headers })
  const ver = await verResp.json()
  const tiers: Record<string, number> = {}
  ver.forEach((t: any) => { tiers[t.tier] = (tiers[t.tier]||0)+1 })
  results.push(`Verify: ${JSON.stringify(tiers)}`)

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
