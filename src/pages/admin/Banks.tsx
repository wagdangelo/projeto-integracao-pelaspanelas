import React, { useState, useEffect } from 'react'
import { getBanks, createBank, updateBank, deleteBank, type Bank } from '@/services/banks'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Plus, Building } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BanksAdmin() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    bank_code: '',
    agency: '',
    account_number: '',
    account_digit: '',
    initial_balance: 0,
    current_balance: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      const data = await getBanks()
      setBanks(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('banks', () => {
    loadData()
  })

  const handleOpenModal = (bank?: Bank) => {
    if (bank) {
      setEditingBank(bank)
      setFormData({
        name: bank.name,
        bank_code: bank.bank_code || '',
        agency: bank.agency || '',
        account_number: bank.account_number || '',
        account_digit: bank.account_digit || '',
        initial_balance: bank.initial_balance || 0,
        current_balance: (bank as any).current_balance ?? bank.initial_balance ?? 0,
      })
    } else {
      setEditingBank(null)
      setFormData({
        name: '',
        bank_code: '',
        agency: '',
        account_number: '',
        account_digit: '',
        initial_balance: 0,
        current_balance: 0,
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingBank) {
        const { current_balance, ...updatePayload } = formData
        await updateBank(editingBank.id, updatePayload)
        toast({ title: 'Banco atualizado com sucesso' })
      } else {
        const createPayload = { ...formData, current_balance: formData.initial_balance }
        await createBank(createPayload)
        toast({ title: 'Banco criado com sucesso' })
      }
      setIsModalOpen(false)
    } catch (e: any) {
      setErrors(extractFieldErrors(e))
      toast({ title: 'Erro ao salvar o banco', variant: 'destructive' })
    }
  }

  const handleDeleteClick = (bank: Bank) => {
    setBankToDelete(bank)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!bankToDelete) return
    try {
      await deleteBank(bankToDelete.id)
      toast({ title: 'Banco excluído com sucesso' })
      setIsDeleteModalOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao excluir banco', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Bancos</h1>
          <p className="text-muted-foreground">Gerencie as instituições financeiras e contas.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Banco
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Banco</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Agência</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Saldo Inicial</TableHead>
              <TableHead>Saldo Atual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Nenhum banco registrado.</p>
                    <Button variant="outline" onClick={() => handleOpenModal()} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Banco
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {bank.name}
                    </div>
                  </TableCell>
                  <TableCell>{bank.bank_code}</TableCell>
                  <TableCell>{bank.agency}</TableCell>
                  <TableCell>
                    {bank.account_number}-{bank.account_digit}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      bank.initial_balance || 0,
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold px-2.5 py-1 rounded-md inline-block',
                        ((bank as any).current_balance ?? bank.initial_balance ?? 0) < 0
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                          : 'text-primary',
                      )}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format((bank as any).current_balance ?? bank.initial_balance ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(bank)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(bank)}
                      className="text-destructive"
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBank ? 'Editar Banco' : 'Novo Banco'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Banco</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Banco do Brasil"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bank_code">Código do Banco</Label>
                <Input
                  id="bank_code"
                  value={formData.bank_code}
                  onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  placeholder="Ex: 001"
                />
                {errors.bank_code && <p className="text-sm text-destructive">{errors.bank_code}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agency">Agência</Label>
                <Input
                  id="agency"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="Ex: 1234"
                />
                {errors.agency && <p className="text-sm text-destructive">{errors.agency}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="account_number">Número da Conta</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Ex: 123456"
                />
                {errors.account_number && (
                  <p className="text-sm text-destructive">{errors.account_number}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_digit">Dígito</Label>
                <Input
                  id="account_digit"
                  maxLength={2}
                  value={formData.account_digit}
                  onChange={(e) => setFormData({ ...formData, account_digit: e.target.value })}
                  placeholder="Ex: X"
                />
                {errors.account_digit && (
                  <p className="text-sm text-destructive">{errors.account_digit}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initial_balance">Saldo Inicial (R$)</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) =>
                  setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
              {errors.initial_balance && (
                <p className="text-sm text-destructive">{errors.initial_balance}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
