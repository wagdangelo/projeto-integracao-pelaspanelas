import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { bank_id } = body

    if (!bank_id) {
      throw new Error('bank_id is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Fetch the bank's initial balance
    const { data: bank, error: bankError } = await supabaseClient
      .from('banks')
      .select('initial_balance')
      .eq('id', bank_id)
      .single()

    if (bankError || !bank) {
      throw new Error('Banco não encontrado')
    }

    // Fetch all transactions for this bank
    const { data: transactions, error: transError } = await supabaseClient
      .from('transactions')
      .select('value, type, status')
      .eq('bank', bank_id)

    if (transError) {
      throw new Error('Erro ao buscar transações: ' + transError.message)
    }

    let entradas = 0
    let saidas = 0

    for (const t of transactions) {
      const status = t.status?.toLowerCase() || ''
      if (status === 'liquidado') {
        const type = t.type?.toLowerCase() || ''
        if (type === 'entrada') {
          entradas += Number(t.value) || 0
        } else if (type === 'saída' || type === 'saida') {
          saidas += Math.abs(Number(t.value) || 0)
        }
      }
    }

    const initialBalance = Number(bank.initial_balance) || 0
    const newBalance = initialBalance + entradas - saidas

    // Update the bank's current balance
    const { error: updateError } = await supabaseClient
      .from('banks')
      .update({ current_balance: newBalance })
      .eq('id', bank_id)

    if (updateError) {
      throw new Error('Erro ao atualizar saldo: ' + updateError.message)
    }

    return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
