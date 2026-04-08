import pb from '@/lib/pocketbase/client'

export interface PaymentMethod {
  id: string
  name: string
  created: string
  updated: string
}

export const getPaymentMethods = () =>
  pb.collection('payment_methods').getFullList<PaymentMethod>({ sort: 'name' })

export const createPaymentMethod = (data: Partial<PaymentMethod>) =>
  pb.collection('payment_methods').create<PaymentMethod>(data)

export const updatePaymentMethod = (id: string, data: Partial<PaymentMethod>) =>
  pb.collection('payment_methods').update<PaymentMethod>(id, data)

export const deletePaymentMethod = (id: string) => pb.collection('payment_methods').delete(id)
