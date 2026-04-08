import pb from '@/lib/pocketbase/client'

export interface PaymentMethodData {
  id: string
  name: string
}

export const getPaymentMethods = () => {
  return pb.collection('payment_methods').getFullList<PaymentMethodData>({ sort: 'name' })
}
