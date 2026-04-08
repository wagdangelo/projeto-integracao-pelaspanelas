import { supabase } from '@/lib/supabase/client'

export type AccountType = 'Receita' | 'Despesa'

export interface ChartOfAccount {
  id: string
  code?: string
  name: string
  type: AccountType
  group: string
  created: string
  updated: string
}

export const getAccounts = async () => {
  const { data, error } = await supabase.from('chart_of_accounts').select('*').order('name')
  if (error) throw error
  return data.map((a: any) => ({
    ...a,
    created: a.created_at,
    updated: a.updated_at,
  })) as ChartOfAccount[]
}

export const createAccount = async (data: Partial<ChartOfAccount>) => {
  const { data: record, error } = await supabase
    .from('chart_of_accounts')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as ChartOfAccount
}

export const updateAccount = async (id: string, data: Partial<ChartOfAccount>) => {
  const { data: record, error } = await supabase
    .from('chart_of_accounts')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as ChartOfAccount
}

export const deleteAccount = async (id: string) => {
  const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id)
  if (error) throw error
  return true
}
