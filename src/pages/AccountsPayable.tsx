import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Check,
  ChevronsUpDown,
  CalendarIcon,
  Edit,
  Trash2,
  CheckCircle2,
  FilterX,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getAccountsPayable, updateTransaction, deleteTransaction } from '@/services/transactions'
import { getBanks, type Bank } from '@/services/banks'
import { getPaymentMethods, type PaymentMethod } from '@/services/paymentMethods'
import { getClients, type Client } from '@/services/clients'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { TransactionModal } from '@/components/TransactionModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Sub-components for inline editing
const EditableNumberCell = ({
  value,
  onSave,
}: {
  value: number
  onSave: (val: number) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(String(value))

  useEffect(() => {
    setTempVal(String(value))
  }, [value])

  const handleSave = () => {
    setIsEditing(false)
    const num = parseFloat(tempVal)
    if (!isNaN(num) && num !== value && num > 0) {
      onSave(num)
    } else {
      setTempVal(String(value))
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer px-2 py-1.5 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors min-h-9 flex items-center font-medium"
      >
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
      </div>
    )
  }

  return (
    <Input
      type="number"
      step="0.01"
      autoFocus
      className="h-9 py-1 px-2 w-28 text-sm"
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
          setIsEditing(false)
          setTempVal(String(value))
        }
      }}
    />
  )
}

const EditableSelectCell = ({
  value,
  options,
  onSave,
  placeholder,
}: {
  value: string
  options: { label: string; value: string }[]
  onSave: (val: string) => void
  placeholder: string
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const selected = options.find((o) => o.value === value)

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer px-2 py-1.5 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors min-h-9 flex items-center text-sm"
      >
        {selected?.label || <span className="text-muted-foreground italic">{placeholder}</span>}
      </div>
    )
  }

  return (
    <Select
      defaultOpen
      onOpenChange={(open) => {
        if (!open) setIsEditing(false)
      }}
      value={value || undefined}
      onValueChange={(val) => {
        onSave(val)
        setIsEditing(false)
      }}
    >
      <SelectTrigger className="h-9 w-36 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function AccountsPayable() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [payees, setPayees] = useState<Client[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('Todos')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [payeeFilter, setPayeeFilter] = useState<string>('Todos')

  // Action states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDependencies = async () => {
    try {
      const [b, pm, p] = await Promise.all([getBanks(), getPaymentMethods(), getClients()])
      setBanks(b)
      setPaymentMethods(pm)
      setPayees(p)
    } catch (error) {
      console.error('Error loading dependencies:', error)
    }
  }

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)

    try {
      const filters: string[] = []
      if (statusFilter !== 'Todos') {
        filters.push(`status = "${statusFilter}"`)
      }
      if (dateRange?.from) {
        filters.push(`due_date >= "${format(dateRange.from, 'yyyy-MM-dd')} 00:00:00.000Z"`)
      }
      if (dateRange?.to) {
        filters.push(`due_date <= "${format(dateRange.to, 'yyyy-MM-dd')} 23:59:59.999Z"`)
      }
      if (payeeFilter !== 'Todos') {
        filters.push(`payee = "${payeeFilter}"`)
      }

      const filterStr = filters.join(' && ')
      const data = await getAccountsPayable(user.id, filterStr)
      setTransactions(data)
    } catch (error) {
      console.error('Error loading accounts payable:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas a pagar.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, statusFilter, dateRange, payeeFilter])

  useEffect(() => {
    loadDependencies()
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('transactions', () => {
    loadData()
  })

  const handleUpdateInline = async (id: string, payload: any) => {
    try {
      await updateTransaction(id, payload)
      toast({ title: 'Salvo', description: 'Transação atualizada com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a transação.',
        variant: 'destructive',
      })
      loadData() // Revert UI
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateTransaction(id, { status: 'Liquidado', payment_date: new Date().toISOString() })
      toast({ title: 'Sucesso', description: 'Conta marcada como paga e saldo atualizado.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível liquidar a conta.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteTransaction(deletingId)
      toast({ title: 'Excluída', description: 'Transação removida com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a transação.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const bankOptions = useMemo(() => banks.map((b) => ({ label: b.name, value: b.id })), [banks])
  const pmOptions = useMemo(
    () => paymentMethods.map((p) => ({ label: p.name, value: p.id })),
    [paymentMethods],
  )

  const clearFilters = () => {
    setStatusFilter('Todos')
    setDateRange(undefined)
    setPayeeFilter('Todos')
  }

  const hasActiveFilters = statusFilter !== 'Todos' || !!dateRange || payeeFilter !== 'Todos'

  return (
    <div className="space-y-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas a Pagar</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas despesas pendentes e atrasadas</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="À Vencer">À Vencer</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal bg-background',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                    ) : (
                      format(dateRange.from, 'dd/MM/yy')
                    )
                  ) : (
                    <span>Filtrar por Vencimento</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange as any}
                  onSelect={setDateRange as any}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[220px] justify-between bg-background"
                >
                  {payeeFilter === 'Todos'
                    ? 'Todos os Favorecidos'
                    : payees.find((p) => p.id === payeeFilter)?.name || 'Selecione...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar favorecido..." />
                  <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      <CommandItem
                        onSelect={() => {
                          setPayeeFilter('Todos')
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            payeeFilter === 'Todos' ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        Todos os Favorecidos
                      </CommandItem>
                      {payees.map((p) => (
                        <CommandItem
                          key={p.id}
                          onSelect={() => {
                            setPayeeFilter(p.id)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              payeeFilter === p.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <FilterX className="mr-2 h-4 w-4" /> Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px]">Vencimento</TableHead>
                  <TableHead>Favorecido</TableHead>
                  <TableHead className="w-[140px]">Valor</TableHead>
                  <TableHead className="w-[160px]">Banco</TableHead>
                  <TableHead className="w-[160px]">Método</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Carregando contas...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhuma conta pendente encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="group transition-colors">
                      <TableCell className="font-medium">
                        {tx.due_date ? format(new Date(tx.due_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {tx.expand?.payee?.name || (
                          <span className="text-muted-foreground text-sm">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EditableNumberCell
                          value={tx.value}
                          onSave={(val) => handleUpdateInline(tx.id, { value: val })}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableSelectCell
                          value={tx.bank}
                          options={bankOptions}
                          placeholder="Selecionar banco"
                          onSave={(val) => handleUpdateInline(tx.id, { bank: val })}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableSelectCell
                          value={tx.payment_method}
                          options={pmOptions}
                          placeholder="Selecionar método"
                          onSave={(val) => handleUpdateInline(tx.id, { payment_method: val })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.status === 'Atrasado' ? 'destructive' : 'secondary'}
                          className={cn(
                            tx.status === 'À Vencer' &&
                              'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(tx.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Pago
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                              >
                                <span className="sr-only">Ações</span>
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTransaction(tx)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Editar Conta
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingId(tx.id)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TransactionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transactionToEdit={editingTransaction}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
