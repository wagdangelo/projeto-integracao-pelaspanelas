import { supabase } from '@/lib/supabase/client'

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((u: any) => ({ ...u, created: u.created_at, updated: u.updated_at }))
}

export const updateUserRole = async (id: string, role: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteUser = async (id: string) => {
  // Can only delete profile via normal API due to auth restrictions.
  // Supabase edge function or admin key is needed to fully delete an auth.user.
  // We'll delete the profile here which is safe.
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
  return true
}
