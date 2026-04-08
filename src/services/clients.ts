import { supabase } from '@/lib/supabase/client'

export interface Client {
  id: string
  name: string
  type: string
  favorecido_type?: string
  created_by?: string
  tax_id: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_city?: string
  address_state?: string
  address_zip_code?: string
  registration_date?: string
  created: string
  updated: string
}

export const getClients = async (filterStr?: string) => {
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })

  // Basic translation of common PocketBase filters if necessary
  if (filterStr) {
    if (filterStr.includes('type =')) {
      const match = filterStr.match(/type\s*=\s*['"]([^'"]+)['"]/)
      if (match) query = query.eq('type', match[1])
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data.map((c: any) => ({ ...c, created: c.created_at, updated: c.updated_at })) as Client[]
}

export const createClient = async (data: Partial<Client>) => {
  const { data: record, error } = await supabase.from('clients').insert([data]).select().single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as Client
}

export const updateClient = async (id: string, data: Partial<Client>) => {
  const { data: record, error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...record, created: record.created_at, updated: record.updated_at } as Client
}

export const deleteClient = async (id: string) => {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  return true
}
