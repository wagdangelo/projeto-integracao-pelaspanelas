import pb from '@/lib/pocketbase/client'

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
  return pb.collection('entregas_lojas').getFullList<EntregaLoja>({
    sort: '-data,-created',
  })
}

export const createEntregaLoja = async (data: Partial<EntregaLoja>) => {
  return pb.collection('entregas_lojas').create<EntregaLoja>(data)
}

export const updateEntregaLoja = async (id: string, data: Partial<EntregaLoja>) => {
  return pb.collection('entregas_lojas').update<EntregaLoja>(id, data)
}

export const deleteEntregaLoja = async (id: string) => {
  return pb.collection('entregas_lojas').delete(id)
}
