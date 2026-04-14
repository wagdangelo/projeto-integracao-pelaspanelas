import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Store as StoreIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { StoreModal } from './StoreModal'

export interface Store {
  id: string
  nome_fantasia: string
  cnpj: string
  razao_social: string
  telefone: string
  endereco_cep: string
  endereco_rua: string
  endereco_numero: string
  endereco_complemento: string
  endereco_bairro: string
  endereco_cidade: string
  endereco_estado: string
  plataforma: string
  codigo_integracao: string
  senha_integracao: string
}

export default function StoresAdmin() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const { toast } = useToast()

  const loadStores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('nome_fantasia', { ascending: true })

      if (error) throw error
      setStores(data || [])
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta loja?')) return
    try {
      const { error } = await supabase.from('lojas').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Loja excluída com sucesso.' })
      loadStores()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const filteredStores = stores.filter(
    (s) =>
      s.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) || s.cnpj?.includes(search),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lojas</h1>
          <p className="text-muted-foreground">Gerencie as lojas e integrações do sistema</p>
        </div>
        <Button
          onClick={() => {
            setEditingStore(null)
            setIsModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Loja
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Fantasia</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredStores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma loja encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="h-4 w-4 text-muted-foreground" />
                      {store.nome_fantasia}
                    </div>
                  </TableCell>
                  <TableCell>{store.cnpj}</TableCell>
                  <TableCell>{store.plataforma}</TableCell>
                  <TableCell>{store.telefone}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingStore(store)
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <StoreModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          store={editingStore}
          onSaved={loadStores}
        />
      )}
    </div>
  )
}
