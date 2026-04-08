import { supabase } from '@/lib/supabase/client'

export interface PaymentMethodData {
  id: string
  name: string
}

export const getPaymentMethods = async () => {
  const { data, error } = await supabase.from('payment_methods').select('*').order('name')
  if (error) throw error
  return data as PaymentMethodData[]
}
