import pb from '@/lib/pocketbase/client'

export interface PayeeData {
  id: string
  name: string
  type: string
  email?: string
  phone?: string
}

export const getPayees = () => {
  return pb.collection('payees').getFullList<PayeeData>({ sort: 'name' })
}
