Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Twilio credentials — set via: supabase secrets set TWILIO_ACCOUNT_SID=xxx TWILIO_AUTH_TOKEN=xxx TWILIO_FROM_NUMBER=xxx
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!
    const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER")!

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const { admin_password, message } = await req.json()

    // ─── Auth check (same pattern as get-orders) ───
    if (!admin_password) {
      return new Response(JSON.stringify({ error: "Password required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const authResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_signup_count`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ admin_password }),
    })

    if (!authResp.ok) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ─── Fetch phone numbers from guest_list (opted_out = false) ───
    const guestResp = await fetch(
      `${SUPABASE_URL}/rest/v1/guest_list?opted_out=eq.false&select=phone`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    const guests = guestResp.ok ? await guestResp.json() : []

    // ─── Fetch phone numbers from signups table ───
    const signupsResp = await fetch(
      `${SUPABASE_URL}/rest/v1/signups?select=phone`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    const signups = signupsResp.ok ? await signupsResp.json() : []

    // ─── Deduplicate phone numbers ───
    const allPhones = new Set<string>()
    for (const g of (Array.isArray(guests) ? guests : [])) {
      if (g.phone) allPhones.add(g.phone.trim())
    }
    for (const s of (Array.isArray(signups) ? signups : [])) {
      if (s.phone) allPhones.add(s.phone.trim())
    }

    // Format all phones to +1XXXXXXXXXX
    const phoneList = Array.from(allPhones)
      .map((p) => {
        // Strip everything except digits
        const digits = p.replace(/\D/g, '')
        // If 10 digits, add +1
        if (digits.length === 10) return '+1' + digits
        // If 11 digits starting with 1, add +
        if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
        // If already has +, return as-is
        if (p.startsWith('+') && digits.length >= 10) return '+' + digits
        return null
      })
      .filter((p): p is string => p !== null && p.length >= 12)

    // ─── Send via Twilio in batches ───
    const BATCH_SIZE = 10
    const BATCH_DELAY_MS = 1000
    let sent = 0
    let failed = 0
    const errors: string[] = []

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    for (let i = 0; i < phoneList.length; i += BATCH_SIZE) {
      const batch = phoneList.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map(async (phone) => {
          const smsBody = new URLSearchParams()
          smsBody.append("To", phone)
          smsBody.append("From", TWILIO_FROM_NUMBER)
          smsBody.append("Body", message)

          const resp = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${twilioAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: smsBody.toString(),
          })

          if (!resp.ok) {
            const err = await resp.json()
            throw new Error(err.message || `Failed to send to ${phone}`)
          }
          return resp.json()
        })
      )

      for (const r of results) {
        if (r.status === "fulfilled") {
          sent++
        } else {
          failed++
          errors.push(r.reason?.message || "Unknown error")
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < phoneList.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // ─── Record the blast in text_blasts table ───
    await fetch(`${SUPABASE_URL}/rest/v1/text_blasts`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        message,
        total_recipients: phoneList.length,
        sent_count: sent,
        failed_count: failed,
      }),
    })

    return new Response(JSON.stringify({ sent, failed, total: phoneList.length, errors: errors.slice(0, 10) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
