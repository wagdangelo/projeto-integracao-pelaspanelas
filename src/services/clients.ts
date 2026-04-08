import pb from '@/lib/pocketbase/client'

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

export const getClients = async (filter?: string) => {
  const records = await pb.collection('clients').getFullList({
    sort: '-created',
    filter,
  })
  return records as unknown as Client[]
}

export const createClient = async (data: Partial<Client>) => {
  const record = await pb.collection('clients').create(data)
  return record as unknown as Client
}

export const updateClient = async (id: string, data: Partial<Client>) => {
  const record = await pb.collection('clients').update(id, data)
  return record as unknown as Client
}

export const deleteClient = async (id: string) => {
  await pb.collection('clients').delete(id)
}
