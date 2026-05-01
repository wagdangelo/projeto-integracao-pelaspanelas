import { useState, useRef, useEffect, DragEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { parseOfxFile, ParsedTransaction } from '@/services/ofx'
import { getBanks, Bank } from '@/services/banks'
import { createTransaction } from '@/services/transactions'
import { getAccounts, ChartOfAccount } from '@/services/chartOfAccounts'
import { getPaymentMethods, PaymentMethod } from '@/services/paymentMethods'
import { getClients, Client } from '@/services/clients'
import { EditableCombobox, EditableSelectGeneric } from '@/components/EditableCells'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditableTransaction extends ParsedTransaction {
  _id: string
  accountId?: string
  group?: string
  paymentMethodId?: string
  payeeId?: string
}

export default function ImportOfx() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [transactions, setTransactions] = useState<EditableTransaction[]>([])
  const [accountInfo, setAccountInfo] = useState<{ bankId: string; acctId: string } | null>(null)

  const [banks, setBanks] = useState<Bank[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [selectedBank, setSelectedBank] = useState<string>('')

  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([])
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [bulkAccountId, setBulkAccountId] = useState<string>('')
  const [bulkGroup, setBulkGroup] = useState<string>('')
  const [bulkPaymentMethodId, setBulkPaymentMethodId] = useState<string>('')
  const [bulkPayeeId, setBulkPayeeId] = useState<string>('')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getBanks()
      .then(setBanks)
      .catch(() =>
        toast({
          title: 'Erro',
          description: 'Erro ao carregar os bancos.',
          variant: 'destructive',
        }),
      )
    getAccounts()
      .then(setAccounts)
      .catch(() => {})
    getPaymentMethods()
      .then(setPaymentMethods)
      .catch(() => {})
    getClients()
      .then(setClientsList)
      .catch(() => {})
  }, [toast])

  useEffect(() => {
    if (accountInfo && banks.length > 0 && !selectedBank) {
      const match = banks.find(
        (b) => b.bank_code === accountInfo.bankId || b.account_number === accountInfo.acctId,
      )
      if (match) {
        setSelectedBank(match.id)
        toast({
          title: 'Banco identificado',
          description: `O banco ${match.name} foi selecionado automaticamente.`,
        })
      }
    }
  }, [accountInfo, banks, selectedBank, toast])

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.ofx'))
      return toast({ title: 'Erro', description: 'Envie um arquivo .ofx', variant: 'destructive' })
    setIsUploading(true)
    try {
      const result = await parseOfxFile(await file.text())
      if (!result.transactions.length)
        return toast({
          title: 'Aviso',
          description: 'Nenhuma transação encontrada.',
          variant: 'destructive',
        })
      setTransactions(result.transactions.map((tx, i) => ({ ...tx, _id: String(i) })))
      setAccountInfo(result.account)
      toast({
        title: 'Sucesso',
        description: `${result.transactions.length} transações extraídas.`,
      })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao processar o arquivo.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) await handleFileProcess(e.dataTransfer.files[0])
  }

  const handleConfirm = async () => {
    if (!selectedBank || !user)
      return toast({ title: 'Atenção', description: 'Selecione um banco.', variant: 'destructive' })
    setIsSaving(true)
    try {
      const now = new Date().toISOString()

      for (const tx of transactions) {
        await createTransaction({
          user_id: user.id,
          launch_date: tx.date,
          description: tx.description,
          value: tx.amount,
          type: tx.type,
          bank: selectedBank,
          account_id: tx.accountId,
          payment_method: tx.paymentMethodId,
          due_date: tx.date,
          payment_date: now,
          payee: tx.payeeId,
          status: 'Liquidado',
        } as any)
      }

      toast({ title: 'Sucesso', description: 'Importação concluída com sucesso!' })
      navigate('/transacoes')
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Erro ao salvar as transações.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateTransactionRow = (index: number, field: keyof EditableTransaction, value: any) => {
    setTransactions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'accountId') {
        const acc = accounts.find((a) => a.id === value)
        if (acc && acc.group) {
          next[index].group = acc.group
        }
      }
      return next
    })
  }

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amt)

  const formatDate = (ds: string) => {
    try {
      return format(new Date(ds), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return ds
    }
  }

  const getSelectedBankName = () => banks.find((b) => b.id === selectedBank)?.name || '-'

  const toggleSelectAll = () => {
    if (selectedTxIds.length === transactions.length) {
      setSelectedTxIds([])
    } else {
      setSelectedTxIds(transactions.map((tx) => tx._id))
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedTxIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleBulkConfirm = () => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (selectedTxIds.includes(tx._id)) {
          return {
            ...tx,
            accountId: bulkAccountId || tx.accountId,
            group: bulkGroup || tx.group,
            paymentMethodId: bulkPaymentMethodId || tx.paymentMethodId,
            payeeId: bulkPayeeId || tx.payeeId,
          }
        }
        return tx
      }),
    )
    setSelectedTxIds([])
    setIsBulkEditModalOpen(false)
    setBulkAccountId('')
    setBulkGroup('')
    setBulkPaymentMethodId('')
    setBulkPayeeId('')
  }

  const uniqueGroups = useMemo(
    () =>
      Array.from(new Set(accounts.map((a) => a.group).filter(Boolean))).map((g) => ({
        value: g,
        label: g,
      })),
    [accounts],
  )
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  )
  const paymentMethodOptions = useMemo(
    () => paymentMethods.map((p) => ({ value: p.id, label: p.name })),
    [paymentMethods],
  )
  const clientOptions = useMemo(
    () => clientsList.map((c) => ({ value: c.id, label: c.name })),
    [clientsList],
  )

  return (
    <div className="container mx-auto py-8 max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar OFX</h1>
        <p className="text-muted-foreground">Importe e refine suas transações bancárias.</p>
      </div>

      {!transactions.length ? (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div
              className={cn(
                'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:bg-muted/50',
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              )}
              <h3 className="text-lg font-semibold">
                {isUploading ? 'Processando arquivo...' : 'Clique ou arraste o arquivo .ofx aqui'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Upload do extrato em formato OFX para importar transações.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".ofx"
                onChange={(e) => e.target.files?.length && handleFileProcess(e.target.files[0])}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Importação</CardTitle>
              <CardDescription>
                Selecione a conta bancária para associar a estas transações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-4">
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco..." />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name} - Ag: {bank.agency} / Cc: {bank.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transações Extraídas</CardTitle>
                <CardDescription>
                  Revise e categorize {transactions.length} transações encontradas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setTransactions([])
                  setAccountInfo(null)
                }}
              >
                Cancelar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedTxIds.length === transactions.length && transactions.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todas"
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Método de Pgto</TableHead>
                      <TableHead>Favorecido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, i) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTxIds.includes(tx._id)}
                            onCheckedChange={() => toggleSelection(tx._id)}
                            aria-label={`Selecionar transação ${tx.description}`}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                          {getSelectedBankName()}
                        </TableCell>
                        <TableCell className="max-w-[200px] text-sm">
                          <span className="truncate block max-w-[200px]" title={tx.description}>
                            {tx.description}
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div
                            className={cn(
                              'font-medium',
                              tx.type === 'entrada'
                                ? 'text-emerald-600 dark:text-emerald-500'
                                : 'text-rose-600 dark:text-rose-500',
                            )}
                          >
                            {tx.type === 'entrada' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <EditableCombobox
                            value={tx.accountId}
                            options={accountOptions}
                            onSave={(v) => updateTransactionRow(i, 'accountId', v)}
                            placeholder="Conta..."
                          />
                        </TableCell>
                        <TableCell>
                          <EditableSelectGeneric
                            value={tx.group}
                            options={uniqueGroups}
                            onSave={(v) => updateTransactionRow(i, 'group', v)}
                            placeholder="Grupo..."
                          />
                        </TableCell>
                        <TableCell>
                          <EditableSelectGeneric
                            value={tx.paymentMethodId}
                            options={paymentMethodOptions}
                            onSave={(v) => updateTransactionRow(i, 'paymentMethodId', v)}
                            placeholder="Método..."
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCombobox
                            value={tx.payeeId}
                            options={clientOptions}
                            onSave={(v) => updateTransactionRow(i, 'payeeId', v)}
                            placeholder="Favorecido..."
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={selectedTxIds.length === 0}
                    onClick={() => setIsBulkEditModalOpen(true)}
                  >
                    Lançar Selecionadas ({selectedTxIds.length})
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={selectedTxIds.length === 0}
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Deletar selecionados ({selectedTxIds.length})
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md border border-amber-200 dark:border-amber-900/50">
                  <AlertCircle className="h-4 w-4" />
                  <p>
                    Revise os detalhes acima antes de confirmar a importação para garantir
                    relatórios precisos.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-6 border-t">
              <Button
                onClick={handleConfirm}
                disabled={!selectedBank || isSaving}
                className="min-w-[200px]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Salvando...' : 'Importar'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transações Selecionadas</DialogTitle>
            <DialogDescription>
              As alterações feitas aqui serão aplicadas a todas as {selectedTxIds.length} transações
              selecionadas. Campos em branco não alterarão o valor atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select
                value={bulkAccountId || undefined}
                onValueChange={(v) => {
                  setBulkAccountId(v)
                  const acc = accounts.find((a) => a.id === v)
                  if (acc && acc.group) {
                    setBulkGroup(acc.group)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={bulkGroup || undefined} onValueChange={setBulkGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueGroups.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={bulkPaymentMethodId || undefined}
                onValueChange={setBulkPaymentMethodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Favorecido</Label>
              <Select value={bulkPayeeId || undefined} onValueChange={setBulkPayeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o favorecido..." />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Transações</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar {selectedTxIds.length} transações? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setTransactions((prev) => prev.filter((tx) => !selectedTxIds.includes(tx._id)))
                setSelectedTxIds([])
                setIsDeleteDialogOpen(false)
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
