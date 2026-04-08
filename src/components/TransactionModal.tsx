import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useAuth } from '@/hooks/use-auth'
import { createTransaction, updateTransaction } from '@/services/transactions'
import { getBanks, type Bank } from '@/services/banks'
import { getTransaction } from '@/services/transactions'
import { getClients, type Client } from '@/services/clients'
import { getAccounts, type ChartOfAccount } from '@/services/chartOfAccounts'
import { getPaymentMethods, type PaymentMethod } from '@/services/paymentMethods'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const formSchema = z.object({
  type: z.enum(['entrada', 'saída'], {
    required_error: 'Selecione o tipo de operação.',
  }),
  group: z.string().optional(),
  account_id: z.string().min(1, 'A conta é obrigatória.'),
  payment_method: z.string().optional(),
  payee: z.string().optional(),
  bank: z.string().min(1, 'O banco é obrigatório.'),
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'O valor deve ser um número positivo.',
  }),
  due_date: z.date({
    required_error: 'A data de vencimento é obrigatória.',
  }),
  paid: z.boolean().default(false),
  description: z.string().optional(),
})

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit?: any
}

export function TransactionModal({ open, onOpenChange, transactionToEdit }: TransactionModalProps) {
  const { user } = useAuth()
  const [banks, setBanks] = useState<Bank[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!transactionToEdit

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'saída',
      group: '',
      account_id: '',
      payment_method: '',
      payee: '',
      bank: '',
      value: '',
      paid: false,
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      Promise.all([getBanks(), getClients(), getAccounts(), getPaymentMethods()])
        .then(([b, c, a, pm]) => {
          setBanks(b)
          setClients(c)
          setAccounts(a)
          setPaymentMethods(pm)

          if (transactionToEdit) {
            getTransaction(transactionToEdit.id)
              .then((freshRecord) => {
                const acc = a.find((ac) => ac.id === freshRecord.account_id)
                form.reset({
                  type: freshRecord.type || 'saída',
                  group: acc?.group || '',
                  account_id: freshRecord.account_id || '',
                  payment_method: freshRecord.payment_method || '',
                  payee: freshRecord.payee || '',
                  bank: freshRecord.bank || '',
                  value: String(freshRecord.value || ''),
                  due_date: freshRecord.due_date ? new Date(freshRecord.due_date) : undefined,
                  paid: freshRecord.status === 'Liquidado',
                  description: freshRecord.description || '',
                })
              })
              .catch(() => {
                // Fallback se a busca falhar
                const acc = a.find((ac) => ac.id === transactionToEdit.account_id)
                form.reset({
                  type: transactionToEdit.type || 'saída',
                  group: acc?.group || '',
                  account_id: transactionToEdit.account_id || '',
                  payment_method: transactionToEdit.payment_method || '',
                  payee: transactionToEdit.payee || '',
                  bank: transactionToEdit.bank || '',
                  value: String(transactionToEdit.value || ''),
                  due_date: transactionToEdit.due_date
                    ? new Date(transactionToEdit.due_date)
                    : undefined,
                  paid: transactionToEdit.status === 'Liquidado',
                  description: transactionToEdit.description || '',
                })
              })
          } else {
            form.reset({
              type: 'saída',
              group: '',
              account_id: '',
              payment_method: '',
              payee: '',
              bank: '',
              value: '',
              paid: false,
              description: '',
            })
          }
        })
        .catch(console.error)
    }
  }, [open, transactionToEdit, form])

  const watchType = form.watch('type')
  const watchGroup = form.watch('group')

  const availableGroups = useMemo(() => {
    const accountType = watchType === 'entrada' ? 'Receita' : 'Despesa'
    const groups = accounts.filter((a) => a.type === accountType).map((a) => a.group)
    return Array.from(new Set(groups)).sort()
  }, [accounts, watchType])

  const availableAccounts = useMemo(() => {
    const accountType = watchType === 'entrada' ? 'Receita' : 'Despesa'
    return accounts.filter((a) => a.type === accountType && a.group === watchGroup)
  }, [accounts, watchType, watchGroup])

  const availablePayees = useMemo(() => {
    return clients.filter((c) => {
      if (watchType === 'entrada') return c.favorecido_type === 'Clientes'
      if (watchType === 'saída') {
        return ['Fornecedores', 'Colaboradores', 'Prestadores de Serviço'].includes(
          c.favorecido_type || '',
        )
      }
      return false
    })
  }, [clients, watchType])

  // Auto-reset dependent fields when parent selection changes
  useEffect(() => {
    if (accounts.length === 0 || clients.length === 0) return

    const currentGroup = form.getValues('group')
    if (currentGroup && !availableGroups.includes(currentGroup)) {
      form.setValue('group', '')
    }
    const currentAcc = form.getValues('account_id')
    if (currentAcc && !availableAccounts.find((a) => a.id === currentAcc)) {
      form.setValue('account_id', '')
    }
    const currentPayee = form.getValues('payee')
    if (currentPayee && !availablePayees.find((p) => p.id === currentPayee)) {
      form.setValue('payee', '')
    }
  }, [
    watchType,
    watchGroup,
    availableGroups,
    availableAccounts,
    availablePayees,
    form,
    accounts.length,
    clients.length,
  ])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return
    setIsSubmitting(true)

    try {
      const selectedAccount = accounts.find((a) => a.id === values.account_id)
      const selectedPayee = clients.find((c) => c.id === values.payee)

      let finalDescription = values.description?.trim()
      if (!finalDescription) {
        finalDescription = [selectedAccount?.name, selectedPayee?.name].filter(Boolean).join(' - ')
      }
      if (!finalDescription) {
        finalDescription = 'Transação'
      }

      // Automatically calculate status
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(values.due_date)
      due.setHours(0, 0, 0, 0)
      const calculatedStatus = values.paid ? 'Liquidado' : due < today ? 'Atrasado' : 'À Vencer'

      const payload: any = {
        description: finalDescription,
        due_date: values.due_date.toISOString(),
        status: calculatedStatus,
        payment_method: values.payment_method || null,
        type: values.type,
        account_id: values.account_id,
        payee: values.payee || null,
        value: Number(values.value),
        bank: values.bank || null,
      }

      if (calculatedStatus === 'Liquidado') {
        payload.payment_date = new Date().toISOString()
      } else {
        payload.payment_date = null
      }

      if (!isEditMode) {
        payload.user_id = user.id
        payload.launch_date = new Date().toISOString()
        await createTransaction(payload)
        toast({
          title: 'Transação salva!',
          description: `${finalDescription} adicionada ao seu fluxo.`,
        })
      } else {
        await updateTransaction(transactionToEdit.id, payload)
        toast({
          title: 'Transação atualizada!',
          description: 'A transação foi atualizada com sucesso.',
        })
      }

      form.reset()
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.keys(fieldErrors).forEach((key) =>
          form.setError(key as any, { message: fieldErrors[key] }),
        )
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a transação.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize os detalhes da transação selecionada.'
              : 'Adicione uma nova entrada ou saída com todos os detalhes.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Receita</SelectItem>
                        <SelectItem value="saída">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={availableGroups.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableGroups.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={!watchGroup || availableAccounts.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorecido</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={availablePayees.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o favorecido" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePayees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um banco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-muted/20">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Já foi pago?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione detalhes sobre esta transação..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Salvando...'
                  : isEditMode
                    ? 'Atualizar Transação'
                    : 'Salvar Transação'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
