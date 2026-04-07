import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const { session_id, customer_email, customer_name, ticket_type, event_date } = await req.json()

  if (!session_id || !customer_email) {
    return new Response(JSON.stringify({ error: "Missing session_id or email" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const GMAIL_USER = Deno.env.get("GMAIL_USER")!
  const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://lacasitabk.com/admin/?verify=${session_id}`)}&bgcolor=000000&color=ffffff`
  const ticketUrl = `https://lacasitabk.com/admin/?ticket=${session_id}`

  const ticketLabels: Record<string, string> = {
    ga_tier1: 'General Admission - Tier 1',
    ga_tier2: 'General Admission - Tier 2',
    ga_tier3: 'General Admission - Tier 3',
    vip_ga: 'VIP General Admission',
    vip_couch_before: 'VIP Couch (Before Midnight)',
    vip_couch_after: 'VIP Couch (After Midnight)',
    vip_high_top_before: 'VIP High Top (Before Midnight)',
    vip_high_top_after: 'VIP High Top (After Midnight)',
    regular_couch_before: 'Bottle Service Couch (Before Midnight)',
    regular_couch_after: 'Bottle Service Couch (After Midnight)',
    regular_high_top: 'Bottle Service High Top',
    dance_ga: 'Dance Night GA',
    ladies_free: 'Ladies Free Entry',
    dance_ga_free: 'Free GA',
    ladies_group: 'Ladies Group x4',
    ga_open_bar: 'GA + Open Bar',
    season_pass_regular: 'Bad Bunny Season Pass',
    season_pass_vip: 'VIP Season Pass',
  }

  const ticketLabel = ticketLabels[ticket_type] || ticket_type

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#FF4D8D,#FF6B9D);padding:30px;text-align:center;">
        <h1 style="margin:0;font-size:28px;letter-spacing:4px;">YOU'RE IN! 🎉</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Your La Casita BK ticket is confirmed</p>
      </div>
      <div style="padding:30px;text-align:center;">
        <div style="background:#FFD600;color:#000;padding:10px;border-radius:8px;margin-bottom:20px;">
          <strong>📱 Screenshot this email or save the QR code!</strong><br/>
          <small>You'll need it at the door</small>
        </div>
        <img src="${qrUrl}" alt="Ticket QR Code" style="width:250px;height:250px;border-radius:12px;border:2px solid #333;" />
        <p style="color:#888;font-size:12px;margin-top:10px;">Show this QR code at the door</p>
        <table style="width:100%;margin-top:20px;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px;color:#888;text-align:left;">Event</td>
            <td style="padding:12px;color:#fff;text-align:right;font-weight:bold;">La Casita BK</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px;color:#888;text-align:left;">Date</td>
            <td style="padding:12px;color:#fff;text-align:right;font-weight:bold;">${event_date || 'TBD'}</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px;color:#888;text-align:left;">Ticket</td>
            <td style="padding:12px;color:#2DD4BF;text-align:right;font-weight:bold;">${ticketLabel}</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px;color:#888;text-align:left;">Name</td>
            <td style="padding:12px;color:#fff;text-align:right;font-weight:bold;">${customer_name || ''}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#888;text-align:left;">Venue</td>
            <td style="padding:12px;color:#FFD600;text-align:right;font-weight:bold;">428 Johnson Ave, Brooklyn, NY 11237</td>
          </tr>
        </table>
        <a href="${ticketUrl}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:linear-gradient(135deg,#FFD600,#FF8C00);color:#000;text-decoration:none;border-radius:50px;font-weight:bold;letter-spacing:2px;">VIEW YOUR TICKET</a>
        <p style="color:#555;font-size:11px;margin-top:20px;">Pulse Hospitality Group — La Casita BK<br/>428 Johnson Ave, Brooklyn, NY 11237</p>
      </div>
    </div>
  `

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    })

    await client.send({
      from: `La Casita BK <${GMAIL_USER}>`,
      to: customer_email,
      subject: `🎟️ Your La Casita BK Ticket — ${ticketLabel}`,
      html,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
