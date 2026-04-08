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

    // 1. Validar a assinatura do webhook (se configurado)
    const webhookSecret = Deno.env.get('IFOOD_WEBHOOK_SECRET')
    if (webhookSecret) {
      const signature = req.headers.get('Authorization') || req.headers.get('x-ifood-signature')
      if (!signature || !signature.includes(webhookSecret)) {
        console.error('Assinatura do webhook inválida ou ausente')
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 2. Extrair os dados da notificação e registrar logs
    const payload = await req.json()
    console.log('Notificação iFood recebida:', JSON.stringify(payload))

    const events = Array.isArray(payload) ? payload : [payload]
    let processedCount = 0
    const errors: any[] = []

    // 3. Processar cada evento
    for (const event of events) {
      try {
        const orderId = event.orderId
        const code = event.fullCode || event.code

        if (!orderId) {
          console.warn('Evento ignorado: sem orderId', event)
          continue
        }

        // Mapear status com base no código do evento iFood
        let newStatus
        if (['PLC', 'REC', 'PLACED', 'CONFIRMED'].includes(code)) newStatus = 'Cozinha'
        else if (['RDA', 'READY_TO_PICKUP'].includes(code)) newStatus = 'Pedido Pronto'
        else if (['DSP', 'DISPATCHED'].includes(code)) newStatus = 'Saiu Para Entrega'
        else if (['CON', 'DELIVERED'].includes(code)) newStatus = 'Entregue'
        else if (['CAN', 'CANCELLED'].includes(code)) newStatus = 'Cancelado'

        let orderRecord: any = {
          updated_at: new Date().toISOString(),
        }

        if (newStatus) {
          orderRecord.status = newStatus
        }

        // Tentar buscar detalhes completos do pedido na API do iFood
        const clientId = Deno.env.get('IFOOD_CLIENT_ID')
        const clientSecret = Deno.env.get('IFOOD_CLIENT_SECRET')

        if (clientId && clientSecret) {
          try {
            const authResponse = await fetch(
              'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  grantType: 'client_credentials',
                  clientId,
                  clientSecret,
                }),
              },
            )

            if (authResponse.ok) {
              const { accessToken } = await authResponse.json()
              const orderResponse = await fetch(
                `https://merchant-api.ifood.com.br/order/v1.0/orders/${orderId}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                },
              )

              if (orderResponse.ok) {
                const orderData = await orderResponse.json()
                let paymentStatus = 'Pendente'
                if (orderData.payments && orderData.payments.prepaid > 0) paymentStatus = 'Pago'

                orderRecord = {
                  ...orderRecord,
                  order_number: orderData.displayId || orderId.substring(0, 8),
                  customer_name: orderData.customer?.name || 'Cliente iFood',
                  customer_phone: orderData.customer?.phone?.number || null,
                  customer_address: orderData.delivery?.deliveryAddress?.formattedAddress || null,
                  marketplace: 'iFood',
                  order_date: orderData.createdAt || new Date().toISOString(),
                  total_value: orderData.total?.orderAmount || 0,
                  payment_status: paymentStatus,
                  status: newStatus || orderRecord.status || 'Cozinha',
                }
              } else {
                console.warn(
                  `Aviso: Falha ao buscar dados completos do pedido ${orderId} no iFood. Status: ${orderResponse.status}`,
                )
              }
            } else {
              console.warn(
                'Aviso: Falha na autenticação com a API do iFood ao tentar buscar detalhes do pedido.',
              )
            }
          } catch (fetchErr) {
            console.error(
              `Erro na comunicação com a API do iFood para o pedido ${orderId}:`,
              fetchErr,
            )
          }
        }

        // Fallback básico caso a API do iFood não responda ou credenciais ausentes
        if (!orderRecord.order_number) {
          orderRecord.order_number = orderId.substring(0, 8)
          orderRecord.marketplace = 'iFood'
        }

        // 4. Atualizar a tabela "orders" automaticamente (Upsert lógico)
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
          console.log(`Pedido ${orderRecord.order_number} atualizado com sucesso.`)
        } else {
          // Preencher defaults para inserção caso não tenha os dados completos
          const insertRecord = {
            order_number: orderRecord.order_number,
            customer_name: orderRecord.customer_name || 'Cliente iFood (Webhook)',
            marketplace: 'iFood',
            total_value: orderRecord.total_value || 0,
            status: orderRecord.status || 'Cozinha',
            payment_status: orderRecord.payment_status || 'Pendente',
            customer_phone: orderRecord.customer_phone || null,
            customer_address: orderRecord.customer_address || null,
            order_date: orderRecord.order_date || new Date().toISOString(),
          }

          const { error: insertError } = await supabaseClient.from('orders').insert([insertRecord])

          if (insertError) throw insertError
          console.log(`Novo pedido ${orderRecord.order_number} inserido com sucesso via webhook.`)
        }

        processedCount++
      } catch (err: any) {
        console.error('Erro processando evento individual:', event, err)
        errors.push({ eventId: event.id || event.orderId, error: err.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro fatal no webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
