import pb from '@/lib/pocketbase/client'

export interface TransactionCategoryData {
  id: string
  name: string
  transaction_type: 'entrada' | 'saída'
}

export const getTransactionCategories = () => {
  return pb
    .collection('transaction_categories')
    .getFullList<TransactionCategoryData>({ sort: 'name' })
}
