import { supabase } from '@/lib/supabase/client'

export const manageUsers = async (action: string, payload: any = {}) => {
  const { data, error } = await supabase.functions.invoke('manageUsers', {
    body: { action, payload },
  })
  if (error) throw error
  if (data.status === 'error') throw new Error(data.message)
  return data.data
}

export const getUsers = async () => {
  const data = await manageUsers('read')
  return data.map((u: any) => ({ ...u, created: u.created_at, updated: u.updated_at }))
}

export const createUser = async (payload: { name: string; email: string; role: string }) => {
  return manageUsers('create', payload)
}

export const updateUserRole = async (id: string, role: string) => {
  return manageUsers('update', { id, role })
}

export const deleteUser = async (id: string) => {
  return manageUsers('delete', { id })
}
