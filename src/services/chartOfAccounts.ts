import pb from '@/lib/pocketbase/client'

export type AccountType = 'Receita' | 'Despesa'

export interface ChartOfAccount {
  id: string
  code?: string
  name: string
  type: AccountType
  group: string
  created: string
  updated: string
}

export const getAccounts = () =>
  pb.collection('chart_of_accounts').getFullList<ChartOfAccount>({ sort: 'name' })

export const createAccount = (data: Partial<ChartOfAccount>) =>
  pb.collection('chart_of_accounts').create<ChartOfAccount>(data)

export const updateAccount = (id: string, data: Partial<ChartOfAccount>) =>
  pb.collection('chart_of_accounts').update<ChartOfAccount>(id, data)

export const deleteAccount = (id: string) => pb.collection('chart_of_accounts').delete(id)
