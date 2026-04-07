import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const { to, subject, html, admin_password } = await req.json()

  if (admin_password !== "DannyManny21") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const GMAIL_USER = Deno.env.get("GMAIL_USER")!
  const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
      },
    })

    await client.send({
      from: `La Casita BK <${GMAIL_USER}>`,
      to,
      subject,
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
