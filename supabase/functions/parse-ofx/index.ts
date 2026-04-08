import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ofxContent } = await req.json()

    // Mock response for OFX Parsing to keep the flow working
    const mockResponse = {
      account: {
        bankId: '001',
        acctId: '123456-7',
      },
      transactions: [
        {
          fitid: `FIT-${Date.now()}-1`,
          date: new Date().toISOString(),
          amount: 2500.0,
          type: 'entrada',
          description: 'TRANSFERENCIA RECEBIDA',
        },
        {
          fitid: `FIT-${Date.now()}-2`,
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          amount: -150.5,
          type: 'saída',
          description: 'PAGAMENTO BOLETO',
        },
      ],
    }

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
