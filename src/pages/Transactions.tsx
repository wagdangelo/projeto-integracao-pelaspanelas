import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, CalendarIcon, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

import { useAuth } from '@/hooks/use-auth'
import { getTransactions, deleteTransaction } from '@/services/transactions'
import { getAccounts, type ChartOfAccount } from '@/services/chartOfAccounts'
import { getBanks, type Bank } from '@/services/banks'
import { useRealtime } from '@/hooks/use-realtime'
import { TransactionModal } from '@/components/TransactionModal'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { toast } from '@/hooks/use-toast'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [transactionToEdit, setTransactionToEdit] = useState<any>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters State
  const [filterType, setFilterType] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [filterBank, setFilterBank] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [limit, setLimit] = useState<string>('20')

  const isAdmin = user?.role === 'Admin'

  const loadData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const limitValue = limit === 'Todos' ? 'all' : parseInt(limit, 10)
      const data = await getTransactions(user.id, limitValue)
      setTransactions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, limit])

  useEffect(() => {
    getAccounts().then(setAccounts).catch(console.error)
    getBanks().then(setBanks).catch(console.error)
  }, [])

  const groups = useMemo(() => {
    const uniqueGroups = new Set(accounts.map((a) => a.group).filter(Boolean))
    return Array.from(uniqueGroups).sort()
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    if (filterGroup === 'all') return accounts
    return accounts.filter((a) => a.group === filterGroup)
  }, [accounts, filterGroup])

  useEffect(() => {
    if (filterGroup !== 'all' && filterAccount !== 'all') {
      const accountExists = filteredAccounts.find((a) => a.id === filterAccount)
      if (!accountExists) setFilterAccount('all')
    }
  }, [filterGroup, filteredAccounts, filterAccount])

  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return new Date()
    if (dateStr.length === 10) return new Date(dateStr + 'T12:00:00')
    return new Date(dateStr)
  }

  useRealtime('transactions', () => {
    loadData()
  })

  const handleEdit = (tx: any) => {
    setTransactionToEdit(tx)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!transactionToDelete) return
    setIsDeleting(true)
    try {
      await deleteTransaction(transactionToDelete.id)
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a transação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setTransactionToDelete(null)
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false
      if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false
      if (filterBank !== 'all' && tx.bank !== filterBank) return false
      if (filterGroup !== 'all') {
        if (tx.expand?.account_id?.group !== filterGroup) return false
      }

      if (dateRange?.from || dateRange?.to) {
        const txDateStr = tx.launch_date.substring(0, 10)
        if (dateRange?.from) {
          const fromStr = format(dateRange.from, 'yyyy-MM-dd')
          if (txDateStr < fromStr) return false
        }
        if (dateRange?.to) {
          const toStr = format(dateRange.to, 'yyyy-MM-dd')
          if (txDateStr > toStr) return false
        }
      }

      return true
    })
  }, [transactions, filterType, filterStatus, filterAccount, filterBank, filterGroup, dateRange])

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Liquidado':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
          >
            Liquidado
          </Badge>
        )
      case 'Atrasado':
        return (
          <Badge
            variant="secondary"
            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20"
          >
            Atrasado
          </Badge>
        )
      case 'À Vencer':
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
          >
            À Vencer
          </Badge>
        )
      default:
        return <span className="text-muted-foreground">-</span>
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 flex-1 w-full max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas entradas e saídas financeiras.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link to="/importacao">
                <Upload className="mr-2 h-4 w-4" />
                Importar OFX
              </Link>
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 bg-card p-4 border rounded-md items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Receita</SelectItem>
              <SelectItem value="saída">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Grupo</label>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Conta</label>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filteredAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Banco</label>
          <Select value={filterBank} onValueChange={setFilterBank}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Liquidado">Liquidado</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="À Vencer">À Vencer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Período</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal px-3',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="truncate">
                      {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                    </span>
                  ) : (
                    <span className="truncate">{format(dateRange.from, 'dd/MM/yyyy')}</span>
                  )
                ) : (
                  <span className="truncate">Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Exibir</label>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger>
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="Todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Lanç.</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>M. Pagamento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Favorecido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  Carregando transações...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(parseDateStr(tx.launch_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    <span className={tx.type === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}>
                      {tx.type === 'entrada' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(tx.value)}
                    </span>
                  </TableCell>
                  <TableCell>{tx.expand?.bank?.name || '-'}</TableCell>
                  <TableCell>{tx.expand?.payment_method?.name || '-'}</TableCell>
                  <TableCell>{tx.expand?.account_id?.name || '-'}</TableCell>
                  <TableCell>{tx.expand?.payee?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(tx)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => setTransactionToDelete(tx)}
                            className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setTransactionToEdit(null)
        }}
        transactionToEdit={transactionToEdit}
      />

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => {
          if (!open) setTransactionToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
