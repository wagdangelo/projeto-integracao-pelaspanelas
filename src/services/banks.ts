import { supabase } from '@/lib/supabase/client'

export interface Bank {
  id: string
  name: string
  account_number: string
  bank_code: string
  agency: string
  account_digit: string
  initial_balance: number
  created: string
  updated: string
}

export const getBanks = async () => {
  const { data, error } = await supabase.from('banks').select('*').order('name')
  if (error) throw error
  return data.map((b: any) => ({ ...b, created: b.created_at, updated: b.updated_at })) as Bank[]
}

export const createBank = async (data: Partial<Bank>) => {
  const { data: record, error } = await supabase.from('banks').insert([data]).select().single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as Bank
}

export const updateBank = async (id: string, data: Partial<Bank>) => {
  const { data: record, error } = await supabase
    .from('banks')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as Bank
}

export const deleteBank = async (id: string) => {
  const { error } = await supabase.from('banks').delete().eq('id', id)
  if (error) throw error
  return true
}
