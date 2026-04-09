import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  EmployeeFormModal,
  initialFormData,
  defaultEscala,
} from '@/components/admin/EmployeeFormModal'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const { user: currentUser } = useAuth()

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true })
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      toast.error('Erro ao carregar funcionários')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useRealtime('funcionarios', () => {
    loadUsers()
  })

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      const { data, error } = await supabase.functions.invoke('manageUsers', {
        body: { action: 'delete', payload: { id: userToDelete } },
      })
      if (error || data?.status === 'error') throw error || new Error(data?.message)

      toast.success('Funcionário removido com sucesso')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar funcionário')
    } finally {
      setUserToDelete(null)
    }
  }

  const handleSave = async (dataToSave: typeof initialFormData) => {
    if (!dataToSave.name || !dataToSave.email) {
      toast.error('Preencha nome e e-mail')
      return
    }

    setIsSaving(true)
    try {
      const action = dataToSave.id ? 'update' : 'create'
      const { data, error } = await supabase.functions.invoke('manageUsers', {
        body: { action, payload: dataToSave },
      })

      if (error || data?.status === 'error') throw error || new Error(data?.message)

      toast.success(`Funcionário ${dataToSave.id ? 'atualizado' : 'criado'} com sucesso`)
      setIsModalOpen(false)
      setFormData(initialFormData)
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar funcionário')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditModal = (user: any) => {
    const parsedEscala =
      typeof user.escala_turnos === 'string'
        ? JSON.parse(user.escala_turnos)
        : user.escala_turnos || defaultEscala

    setFormData({
      id: user.id,
      name: user.nome || '',
      email: user.email || '',
      password: '',
      cpf: user.cpf || '',
      telefone: user.telefone || '',
      data_nascimento: user.data_nascimento || '',
      role: user.role || 'Colaborador',
      cargo: user.cargo || '',
      turno: user.turno || '',
      data_admissao: user.data_admissao || '',
      salario: user.salario || '',
      vale_transporte: user.vale_transporte || '',
      endereco: user.endereco || '',
      escala_turnos: parsedEscala,
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">RH / Funcionários</h2>
          <p className="text-muted-foreground">Gerencie a equipe, perfis e escalas.</p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialFormData)
            setIsModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo / Turno</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.foto_url || ''} />
                      <AvatarFallback>
                        {user.nome?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.nome || 'Sem nome'}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{user.cargo || '-'}</span>
                      <span className="text-xs text-muted-foreground">{user.turno || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.telefone || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                      {user.role || 'Colaborador'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={user.email === currentUser?.email}
                      onClick={() => setUserToDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o funcionário e seus
              acessos ao sistema.
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

      <EmployeeFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={formData}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
