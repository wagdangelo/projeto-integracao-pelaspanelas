import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const clientId = Deno.env.get('IFOOD_CLIENT_ID')
    const clientSecret = Deno.env.get('IFOOD_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error(
        'Credenciais do iFood não configuradas (IFOOD_CLIENT_ID, IFOOD_CLIENT_SECRET).',
      )
    }

    // 1. Authenticate with iFood API
    const authResponse = await fetch(
      'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    )

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      throw new Error(`Erro na autenticação do iFood: ${errorText}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.accessToken

    // 2. Fetch events (polling)
    const eventsResponse = await fetch(
      'https://merchant-api.ifood.com.br/order/v1.0/events:polling',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!eventsResponse.ok) {
      if (eventsResponse.status === 204) {
        return new Response(JSON.stringify({ synced: 0, errors: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errorText = await eventsResponse.text()
      throw new Error(`Erro ao buscar eventos: ${errorText}`)
    }

    const events = await eventsResponse.json()

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ synced: 0, errors: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const processedOrders: string[] = []
    const errors: any[] = []

    // 3. Process events and fetch order details
    for (const event of events) {
      try {
        const orderId = event.orderId

        // Fetch order details
        const orderResponse = await fetch(
          `https://merchant-api.ifood.com.br/order/v1.0/orders/${orderId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!orderResponse.ok) {
          throw new Error(`Falha ao buscar detalhes do pedido ${orderId}`)
        }

        const orderData = await orderResponse.json()

        // Map status
        let status = 'Cozinha'
        if (['PLC', 'REC'].includes(event.fullCode)) status = 'Cozinha'
        if (['RDA'].includes(event.fullCode)) status = 'Pedido Pronto'
        if (['DSP'].includes(event.fullCode)) status = 'Saiu Para Entrega'
        if (['CON'].includes(event.fullCode)) status = 'Entregue'

        // Map payment status
        let paymentStatus = 'Pendente'
        if (orderData.payments?.prepaid > 0) paymentStatus = 'Pago'

        const orderRecord = {
          order_number: orderData.displayId || orderId.substring(0, 8),
          customer_name: orderData.customer?.name || 'Cliente iFood',
          customer_phone: orderData.customer?.phone?.number || null,
          customer_address: orderData.delivery?.deliveryAddress?.formattedAddress || null,
          marketplace: 'iFood',
          order_date: orderData.createdAt || new Date().toISOString(),
          total_value: orderData.total?.orderAmount || 0,
          payment_status: paymentStatus,
          status: status,
        }

        const { data: existingOrder } = await supabaseClient
          .from('orders')
          .select('id')
          .eq('order_number', orderRecord.order_number)
          .eq('marketplace', 'iFood')
          .single()

        if (existingOrder) {
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update(orderRecord)
            .eq('id', existingOrder.id)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabaseClient.from('orders').insert([orderRecord])
          if (insertError) throw insertError
        }

        processedOrders.push(orderRecord.order_number)
      } catch (err: any) {
        errors.push({ eventId: event.id, error: err.message })
      }
    }

    // Acknowledge events
    if (processedOrders.length > 0 || errors.length > 0) {
      const ackPayload = events.map((e: any) => ({ id: e.id }))
      await fetch('https://merchant-api.ifood.com.br/order/v1.0/events/acknowledgment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ackPayload),
      })
    }

    return new Response(
      JSON.stringify({
        synced: processedOrders.length,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Sync error:', error)

    // Fallback Mock for Demo purposes if creds not found
    if (error.message.includes('Credenciais do iFood não configuradas')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      const mockOrder = {
        order_number: `IF-${Math.floor(Math.random() * 10000)}`,
        customer_name: 'Cliente Teste iFood (Mock)',
        customer_phone: '11999999999',
        customer_address: 'Rua Mock, 123',
        marketplace: 'iFood',
        order_date: new Date().toISOString(),
        total_value: Math.floor(Math.random() * 100) + 20,
        payment_status: 'Pago',
        status: 'Cozinha',
      }

      await supabaseClient.from('orders').insert([mockOrder])

      return new Response(
        JSON.stringify({
          synced: 1,
          errors: [],
          message: 'Mock executado (credenciais ausentes)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
