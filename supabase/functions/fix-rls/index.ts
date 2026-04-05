import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Use service role to insert test signup directly
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Check existing RLS policies on signups
  const { data: policies, error: polErr } = await supabase
    .from('pg_policies')
    .select('*')

  // Try to create policy via raw SQL
  const results: string[] = []

  // Drop and recreate the insert policy
  try {
    const { error: e1 } = await supabase.rpc('exec_sql', {
      sql: "DROP POLICY IF EXISTS \"Allow anon inserts to signups\" ON signups;"
    })
    results.push(`Drop old policy: ${e1 ? e1.message : 'OK'}`)
  } catch (e) {
    results.push(`Drop error: ${(e as Error).message}`)
  }

  try {
    const { error: e2 } = await supabase.rpc('exec_sql', {
      sql: "CREATE POLICY \"Allow anon inserts to signups\" ON signups FOR INSERT TO anon WITH CHECK (true);"
    })
    results.push(`Create policy: ${e2 ? e2.message : 'OK'}`)
  } catch (e) {
    results.push(`Create error: ${(e as Error).message}`)
  }

  // Also try enabling RLS just in case
  try {
    const { error: e3 } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE signups ENABLE ROW LEVEL SECURITY;"
    })
    results.push(`Enable RLS: ${e3 ? e3.message : 'OK'}`)
  } catch (e) {
    results.push(`RLS error: ${(e as Error).message}`)
  }

  // Verify: try inserting with anon key
  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_KEY)
  const { error: insertErr } = await anonClient.from('signups').insert({
    first_name: 'RLS_Test',
    last_name: 'Verify',
    email: 'rls_verify@test.com',
    phone: '+10000000000'
  })
  results.push(`Anon insert test: ${insertErr ? insertErr.message : 'SUCCESS'}`)

  // If anon insert failed, try a different approach - disable RLS entirely
  if (insertErr) {
    // Use service role to check policies
    const { data: existingPolicies } = await supabase.from('signups').select('count').limit(1)
    results.push(`Service role can read: ${existingPolicies ? 'yes' : 'no'}`)
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
