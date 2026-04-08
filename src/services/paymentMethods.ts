import { supabase } from '@/lib/supabase/client'

export interface PaymentMethod {
  id: string
  name: string
  created: string
  updated: string
}

export const getPaymentMethods = async () => {
  const { data, error } = await supabase.from('payment_methods').select('*').order('name')
  if (error) throw error
  return data.map((p: any) => ({
    ...p,
    created: p.created_at,
    updated: p.updated_at,
  })) as PaymentMethod[]
}

export const createPaymentMethod = async (data: Partial<PaymentMethod>) => {
  const { data: record, error } = await supabase
    .from('payment_methods')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as PaymentMethod
}

export const updatePaymentMethod = async (id: string, data: Partial<PaymentMethod>) => {
  const { data: record, error } = await supabase
    .from('payment_methods')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as PaymentMethod
}

export const deletePaymentMethod = async (id: string) => {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id)
  if (error) throw error
  return true
}
