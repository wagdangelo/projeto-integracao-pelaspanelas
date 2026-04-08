import pb from '@/lib/pocketbase/client'

export interface Bank {
  id: string
  name: string
  account_number: string
  bank_code: string
  agency: string
  account_digit: string
  initial_balance: number
  created: string
  updated: string
}

export const getBanks = () => {
  return pb.collection('banks').getFullList<Bank>({
    sort: 'name',
  })
}

export const createBank = (data: Partial<Bank>) => {
  return pb.collection('banks').create<Bank>(data)
}

export const updateBank = (id: string, data: Partial<Bank>) => {
  return pb.collection('banks').update<Bank>(id, data)
}

export const deleteBank = (id: string) => {
  return pb.collection('banks').delete(id)
}
