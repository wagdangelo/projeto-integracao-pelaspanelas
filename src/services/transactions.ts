import { supabase } from '@/lib/supabase/client'

export interface TransactionData {
  id?: string
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

const getUserRole = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  return data?.role
}

const mapSupabaseToPB = (records: any[]) => {
  return records.map((record) => {
    const expand: any = {}
    let mappedRecord = { ...record }

    if (record.bank && typeof record.bank === 'object') {
      expand.bank = record.bank
      mappedRecord.bank = record.bank.id
    }
    if (record.payment_method && typeof record.payment_method === 'object') {
      expand.payment_method = record.payment_method
      mappedRecord.payment_method = record.payment_method.id
    }
    if (record.account_id && typeof record.account_id === 'object') {
      expand.account_id = record.account_id
      mappedRecord.account_id = record.account_id.id
    }
    if (record.payee && typeof record.payee === 'object') {
      expand.payee = record.payee
      mappedRecord.payee = record.payee.id
    }

    return {
      ...mappedRecord,
      expand,
      created: record.created_at,
      updated: record.updated_at,
    }
  })
}

export const getTransactions = async (userId: string) => {
  const role = await getUserRole()
  let query = supabase
    .from('transactions')
    .select(
      '*, bank:banks(*), payment_method:payment_methods(*), account_id:chart_of_accounts(*), payee:clients(*)',
    )
    .order('launch_date', { ascending: false })

  if (role !== 'Admin' && role !== 'Gerente') {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return mapSupabaseToPB(data)
}

export const getAccountsPayable = async (userId: string, filterStr?: string) => {
  const role = await getUserRole()
  let query = supabase
    .from('transactions')
    .select(
      '*, bank:banks(*), payment_method:payment_methods(*), account_id:chart_of_accounts(*), payee:clients(*)',
    )
    .eq('type', 'saída')
    .neq('status', 'Liquidado')
    .order('due_date', { ascending: true })

  if (role !== 'Admin' && role !== 'Gerente') {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error

  let result = mapSupabaseToPB(data)
  // Fallback JS filter for complex strings if needed
  if (filterStr) {
    // Basic implementation for dashboard compatibility
    if (filterStr.includes('due_date >=')) {
      result = result.filter((t) => t.due_date && new Date(t.due_date) >= new Date()) // Simplified
    }
  }
  return result
}

export const getAccountsReceivable = async (userId: string, filterStr?: string) => {
  const role = await getUserRole()
  let query = supabase
    .from('transactions')
    .select(
      '*, bank:banks(*), payment_method:payment_methods(*), account_id:chart_of_accounts(*), payee:clients(*)',
    )
    .eq('type', 'entrada')
    .neq('status', 'Liquidado')
    .order('due_date', { ascending: true })

  if (role !== 'Admin' && role !== 'Gerente') {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return mapSupabaseToPB(data)
}

export const getTransaction = async (id: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      '*, bank:banks(*), payment_method:payment_methods(*), account_id:chart_of_accounts(*), payee:clients(*)',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return mapSupabaseToPB([data])[0] as any
}

export const createTransaction = async (data: TransactionData) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ''),
  )
  const { data: record, error } = await supabase
    .from('transactions')
    .insert([cleanData])
    .select()
    .single()
  if (error) throw error
  return record
}

export const updateTransaction = async (id: string, data: Partial<TransactionData>) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ''),
  )
  const { data: record, error } = await supabase
    .from('transactions')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return record
}

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
  return true
}
