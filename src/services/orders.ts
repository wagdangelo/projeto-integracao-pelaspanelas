import { supabase } from '@/lib/supabase/client'

export type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  customer_address: string | null
  marketplace: string
  order_date: string
  total_value: number
  payment_status: string
  status: string
  user_id: string | null
  created_at: string
  updated_at: string
}

export const ordersService = {
  async syncIfoodOrders() {
    const { data, error } = await supabase.functions.invoke('sync-ifood-orders', {
      method: 'POST',
    })
    if (error) throw error
    return data
  },

  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false })

    if (error) throw error
    return data as Order[]
  },

  async updateOrderStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Order
  },
}
