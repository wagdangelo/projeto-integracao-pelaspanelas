import { supabase } from '@/lib/supabase/client'

export interface TransactionCategoryData {
  id: string
  name: string
  transaction_type: 'entrada' | 'saída'
}

export const getTransactionCategories = async () => {
  const { data, error } = await supabase.from('transaction_categories').select('*').order('name')
  if (error) throw error
  return data as TransactionCategoryData[]
}
