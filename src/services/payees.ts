import { supabase } from '@/lib/supabase/client'

export interface PayeeData {
  id: string
  name: string
  type: string
  email?: string
  phone?: string
}

export const getPayees = async () => {
  const { data, error } = await supabase.from('payees').select('*').order('name')
  if (error) throw error
  return data as PayeeData[]
}
