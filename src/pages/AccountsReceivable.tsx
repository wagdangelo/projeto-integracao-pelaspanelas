import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getAccountsReceivable,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions'
import { getBanks, Bank } from '@/services/banks'
import { getPaymentMethods, PaymentMethod } from '@/services/paymentMethods'
import { getClients, Client } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Check, Edit2, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Label } from '@/components/ui/label'
import { EditableValue, EditableSelect } from '@/components/EditableCells'

const EditDialog = ({ tx, banks, clients, methods, onClose }: any) => {
  const { toast } = useToast()
  const [form, setForm] = useState({
    ...tx,
    payee: tx.payee || 'none',
    payment_method: tx.payment_method || 'none',
    due_date: tx.due_date?.split(' ')[0] || '',
  })

  const handleSave = async () => {
    try {
      await updateTransaction(tx.id, {
        ...form,
        payee: form.payee === 'none' ? '' : form.payee,
        payment_method: form.payment_method === 'none' ? '' : form.payment_method,
        due_date: form.due_date ? `${form.due_date} 12:00:00.000Z` : '',
      })
      toast({ title: 'Sucesso ao atualizar' })
      onClose()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Banco</Label>
            <Select value={form.bank} onValueChange={(v) => setForm({ ...form, bank: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Método</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) => setForm({ ...form, payment_method: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {methods.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Favorecido</Label>
            <Select value={form.payee} onValueChange={(v) => setForm({ ...form, payee: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Favorecido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Vencimento</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AccountsReceivable() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [txs, setTxs] = useState<any[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [status, setStatus] = useState('all')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [payee, setPayee] = useState('all')
  const [editTx, setEditTx] = useState<any>(null)
  const [delId, setDelId] = useState<string | null>(null)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const filters = []
      if (status !== 'all') filters.push(`status = "${status}"`)
      if (start) filters.push(`due_date >= "${start} 00:00:00"`)
      if (end) filters.push(`due_date <= "${end} 23:59:59"`)
      if (payee !== 'all') filters.push(`payee = "${payee}"`)
      setTxs(await getAccountsReceivable(user.id, filters.join(' && ')))
    } catch {
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [user, status, start, end, payee])
  useRealtime('transactions', loadData)

  useEffect(() => {
    getBanks().then(setBanks)
    getPaymentMethods().then(setMethods)
    getClients().then(setClients)
  }, [])

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      await updateTransaction(id, { [field]: value })
      toast({ title: 'Atualizado' })
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
      loadData()
    }
  }

  const handleMarkReceived = async (id: string) => {
    try {
      await updateTransaction(id, { status: 'Liquidado' })
      toast({ title: 'Liquidado!' })
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!delId) return
    try {
      await deleteTransaction(delId)
      toast({ title: 'Excluído' })
      setDelId(null)
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
        <p className="text-muted-foreground">Gerencie suas receitas pendentes e atrasadas.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <div className="grid gap-2 flex-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="À Vencer">À Vencer</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 flex-1">
          <Label>Favorecido</Label>
          <Select value={payee} onValueChange={setPayee}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 flex-1">
          <Label>Início</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-2 flex-1">
          <Label>Fim</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-end pb-[2px]">
          <Button
            variant="ghost"
            onClick={() => {
              setStatus('all')
              setPayee('all')
              setStart('')
              setEnd('')
            }}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="border rounded-md bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Favorecido</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Método Pgto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              txs.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {tx.due_date ? format(parseISO(tx.due_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{tx.expand?.payee?.name || '-'}</TableCell>
                  <TableCell>
                    <EditableValue
                      value={tx.value}
                      onSave={(v) => handleUpdate(tx.id, 'value', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableSelect
                      value={tx.bank}
                      options={banks}
                      displayValue={tx.expand?.bank?.name || ''}
                      onSave={(v) => handleUpdate(tx.id, 'bank', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableSelect
                      value={tx.payment_method || ''}
                      options={methods}
                      displayValue={tx.expand?.payment_method?.name || ''}
                      onSave={(v) => handleUpdate(tx.id, 'payment_method', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'Atrasado' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'}`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500"
                        onClick={() => handleMarkReceived(tx.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditTx(tx)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDelId(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editTx && (
        <EditDialog
          tx={editTx}
          banks={banks}
          clients={clients}
          methods={methods}
          onClose={() => setEditTx(null)}
        />
      )}

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
