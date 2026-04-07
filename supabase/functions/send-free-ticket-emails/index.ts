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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const dbHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }

  // Get free ticket bookings
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/bookings?booking_type=eq.ladies_free&status=eq.confirmed&customer_email=not.like.*test.com&select=id,customer_name,customer_email,booking_type,event_id&order=created_at&offset=${offset}&limit=${batch_size}`,
    { headers: dbHeaders }
  )
  const bookings = await resp.json()

  // Get total count
  const countResp = await fetch(
    `${SUPABASE_URL}/rest/v1/bookings?booking_type=eq.ladies_free&status=eq.confirmed&customer_email=not.like.*test.com&select=id`,
    { headers: { ...dbHeaders, "Prefer": "count=exact" } }
  )
  const total = parseInt(countResp.headers.get("content-range")?.split("/")[1] || "0")

  let sent = 0, failed = 0
  const errors: string[] = []

  for (const b of bookings) {
    // Get event date
    const evResp = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${b.event_id}&select=event_date`, { headers: dbHeaders })
    const evData = await evResp.json()
    const eventDate = evData?.[0]?.event_date || ""

    try {
      const emailResp = await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `free_${b.id}`,
          customer_email: b.customer_email,
          customer_name: b.customer_name,
          ticket_type: b.booking_type,
          event_date: eventDate,
        }),
      })
      const data = await emailResp.json()
      if (data.success) sent++
      else { failed++; errors.push(`${b.customer_email}: ${data.error}`) }
    } catch (e) {
      failed++
    }

    await new Promise(r => setTimeout(r, 1500))
  }

  return new Response(JSON.stringify({ sent, failed, total, offset, batch_size, next_offset: offset + batch_size, errors: errors.slice(0, 5) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
