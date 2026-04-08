import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getClients, deleteClient, type Client } from '@/services/clients'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import { ClientModal } from '@/components/clients/ClientModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const formatCpfCnpj = (value: string | undefined, type: string) => {
  if (!value) return '-'
  const digits = value.replace(/\D/g, '')
  if (type === 'Pessoa Física') {
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    return value
  } else {
    if (digits.length === 14)
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    return value
  }
}

const formatPhone = (value: string | undefined) => {
  if (!value) return '-'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1)$2-$3')
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1)$2-$3')
  return value
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [deletingClient, setDeletingClient] = useState<Client | undefined>()

  const loadData = async () => {
    try {
      const filter = filterType !== 'all' ? `favorecido_type = '${filterType}'` : undefined
      const data = await getClients(filter)
      setClients(data)
    } catch (error) {
      toast.error('Erro ao carregar favorecidos')
    }
  }

  useEffect(() => {
    loadData()
  }, [filterType])

  useRealtime('clients', () => loadData())

  const handleDelete = async () => {
    if (!deletingClient) return
    try {
      await deleteClient(deletingClient.id)
      toast.success('Favorecido excluído com sucesso')
    } catch (error) {
      toast.error('Erro ao excluir favorecido')
    } finally {
      setDeletingClient(undefined)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Favorecidos</h1>
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Clientes">Clientes</SelectItem>
              <SelectItem value="Fornecedores">Fornecedores</SelectItem>
              <SelectItem value="Colaboradores">Colaboradores</SelectItem>
              <SelectItem value="Prestadores de Serviço">Prestadores de Serviço</SelectItem>
              <SelectItem value="Bancos">Bancos</SelectItem>
              <SelectItem value="Transf. Entre Contas">Transf. Entre Contas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingClient(undefined)
              setIsModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Favorecido
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo de Favorecido</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  Nenhum favorecido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.favorecido_type || '-'}</TableCell>
                  <TableCell>{formatCpfCnpj(client.tax_id, client.type)}</TableCell>
                  <TableCell>{client.email || '-'}</TableCell>
                  <TableCell>{formatPhone(client.phone)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingClient(client)
                            setIsModalOpen(true)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeletingClient(client)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientModal open={isModalOpen} onOpenChange={setIsModalOpen} client={editingClient} />

      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir favorecido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o favorecido <strong>{deletingClient?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
