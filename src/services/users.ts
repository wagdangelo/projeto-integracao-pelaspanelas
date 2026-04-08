import pb from '@/lib/pocketbase/client'

export const getUsers = () => pb.collection('users').getFullList({ sort: '-created' })

export const updateUserRole = (id: string, role: string) =>
  pb.collection('users').update(id, { role })

export const deleteUser = (id: string) => pb.collection('users').delete(id)
