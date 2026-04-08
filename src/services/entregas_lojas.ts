import { supabase } from '@/lib/supabase/client'

export interface EntregaLoja {
  id: string
  data: string
  turno: 'Dia' | 'Noite'
  loja: string
  quantidade: number
  faturamento: number
  user_id: string
  created: string
  updated: string
}

export const getEntregasLojas = async () => {
  const { data, error } = await supabase
    .from('entregas_lojas')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((e: any) => ({
    ...e,
    created: e.created_at,
    updated: e.updated_at,
  })) as EntregaLoja[]
}

export const createEntregaLoja = async (data: Partial<EntregaLoja>) => {
  const { data: record, error } = await supabase
    .from('entregas_lojas')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as EntregaLoja
}

export const updateEntregaLoja = async (id: string, data: Partial<EntregaLoja>) => {
  const { data: record, error } = await supabase
    .from('entregas_lojas')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as EntregaLoja
}

export const deleteEntregaLoja = async (id: string) => {
  const { error } = await supabase.from('entregas_lojas').delete().eq('id', id)
  if (error) throw error
  return true
}
