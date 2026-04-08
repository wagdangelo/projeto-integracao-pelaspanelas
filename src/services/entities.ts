import { supabase } from '@/lib/supabase/client'

export interface EntityData {
  id: string
  name: string
  type: string
}

export const getEntities = async () => {
  const { data, error } = await supabase.from('entities').select('*').order('name')
  if (error) throw error
  return data as EntityData[]
}
