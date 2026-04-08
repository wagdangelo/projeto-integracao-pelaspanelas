import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { createAccount, updateAccount, ChartOfAccount } from '@/services/chartOfAccounts'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const GROUPS_RECEITA = [
  'Entradas Operacionais',
  'Entradas Não Operacionais',
  'Investimentos',
] as const
const GROUPS_DESPESA = [
  'Despesas com Pessoal',
  'Despesas Administrativas',
  'Despesas de Ocupação',
  'Despesas com Compras',
  'Impostos sobre Vendas',
  'Saídas Não Operacionais',
  'Despesas Financeiras',
  'Despesas com Vendas',
  'Investimentos',
] as const

const schema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  type: z.enum(['Receita', 'Despesa']),
  group: z.string().min(1, 'Obrigatório'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: ChartOfAccount | null
}

export function AccountDialog({ open, onOpenChange, account }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Receita', group: '', name: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        account
          ? { name: account.name, type: account.type, group: account.group }
          : { type: 'Receita', group: '', name: '' },
      )
    }
  }, [open, account, form])

  const selectedType = form.watch('type')
  const groupOptions = selectedType === 'Receita' ? GROUPS_RECEITA : GROUPS_DESPESA

  useEffect(() => {
    const currentGroup = form.getValues('group')
    if (selectedType === 'Receita' && !GROUPS_RECEITA.includes(currentGroup as any)) {
      form.setValue('group', '')
    } else if (selectedType === 'Despesa' && !GROUPS_DESPESA.includes(currentGroup as any)) {
      form.setValue('group', '')
    }
  }, [selectedType, form])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      if (account) await updateAccount(account.id, data)
      else await createAccount(data)

      toast({ title: 'Sucesso', description: 'Conta salva com sucesso.' })
      onOpenChange(false)
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      Object.entries(fieldErrors).forEach(([field, msg]) => {
        form.setError(field as keyof FormValues, { message: msg })
      })
      if (Object.keys(fieldErrors).length === 0) {
        toast({ title: 'Erro', description: 'Falha ao salvar conta.', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Venda de Produtos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Despesa">Despesa</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupOptions.map((g) => (
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
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
