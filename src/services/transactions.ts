import pb from '@/lib/pocketbase/client'

export interface TransactionData {
  user_id: string
  launch_date: string
  description: string
  value: number
  type: 'entrada' | 'saída'
  bank: string
  due_date?: string
  payment_date?: string
  payment_method?: string
  account_id?: string
  payee?: string
  status: string
}

export const getTransactions = (userId: string) => {
  const role = pb.authStore.record?.role
  const filter = role === 'Admin' || role === 'Gerente' ? '' : `user_id = "${userId}"`

  return pb.collection('transactions').getFullList({
    filter,
    sort: '-launch_date',
    expand: 'bank,payment_method,account_id,payee',
  })
}

export const getAccountsPayable = async (userId: string, filterStr?: string) => {
  const role = pb.authStore.record?.role
  const conditions = ['type = "saída"', 'status != "Liquidado"']

  if (role !== 'Admin' && role !== 'Gerente') {
    conditions.push(`user_id = "${userId}"`)
  }
  if (filterStr) {
    conditions.push(`(${filterStr})`)
  }

  return pb.collection('transactions').getFullList({
    filter: conditions.join(' && '),
    sort: 'due_date',
    expand: 'bank,payment_method,account_id,payee',
  })
}

export const getAccountsReceivable = async (userId: string, filterStr?: string) => {
  const role = pb.authStore.record?.role
  const conditions = ['type = "entrada"', 'status != "Liquidado"']

  if (role !== 'Admin' && role !== 'Gerente') {
    conditions.push(`user_id = "${userId}"`)
  }
  if (filterStr) {
    conditions.push(`(${filterStr})`)
  }

  return pb.collection('transactions').getFullList({
    filter: conditions.join(' && '),
    sort: 'due_date',
    expand: 'bank,payment_method,account_id,payee',
  })
}

export const getTransaction = (id: string) => {
  return pb.collection('transactions').getOne<TransactionData>(id)
}

export const createTransaction = (data: TransactionData) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ''),
  )
  return pb.collection('transactions').create(cleanData)
}

export const updateTransaction = (id: string, data: Partial<TransactionData>) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ''),
  )
  return pb.collection('transactions').update(id, cleanData)
}

export const deleteTransaction = (id: string) => {
  return pb.collection('transactions').delete(id)
}
