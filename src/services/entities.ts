import pb from '@/lib/pocketbase/client'

export interface EntityData {
  id: string
  name: string
  type: string
}

export const getEntities = () => {
  return pb.collection('entities').getFullList<EntityData>({ sort: 'name' })
}
