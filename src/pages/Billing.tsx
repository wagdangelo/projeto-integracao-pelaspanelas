import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Store, Save, Filter, Edit, Trash2, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import {
  getEntregasLojas,
  createEntregaLoja,
  updateEntregaLoja,
  deleteEntregaLoja,
  type EntregaLoja,
} from '@/services/entregas_lojas'
import { useRealtime } from '@/hooks/use-realtime'

const STORES = [
  'Pelas Panelas Delivery',
  'Pelas Panelas App',
  'Feijoada do Pelas',
  'Feijocas Ifood',
  'Feijocas 99Food',
  'Feijocas Keeta',
  'Balcão',
]

const formatBRL = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
const parseBRL = (value: string) => parseInt(value.replace(/\D/g, '') || '0', 10) / 100

const formSchema = z.object({
  data: z.date({ required_error: 'A data é obrigatória.' }),
  turno: z.enum(['Dia', 'Noite'], { required_error: 'O turno é obrigatório.' }),
  loja: z.string({ required_error: 'A loja é obrigatória.' }).min(1, 'A loja é obrigatória.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  faturamento: z.string().min(1, 'O faturamento é obrigatório.'),
})

export default function Billing() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Gerente'

  const [records, setRecords] = useState<EntregaLoja[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [shiftFilter, setShiftFilter] = useState<string>('all')

  const [editingRecord, setEditingRecord] = useState<EntregaLoja | null>(null)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const data = await getEntregasLojas()
      setRecords(data)
    } catch (error) {
      toast.error('Erro ao carregar dados.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('entregas_lojas', () => {
    loadData()
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { quantidade: 0, faturamento: '' },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        data: values.data.toISOString(),
        turno: values.turno,
        loja: values.loja,
        quantidade: values.quantidade,
        faturamento: parseBRL(values.faturamento),
        user_id: user?.id || '',
      }

      if (editingRecord) {
        await updateEntregaLoja(editingRecord.id, payload)
        toast.success('Registro atualizado com sucesso!')
        setEditingRecord(null)
      } else {
        await createEntregaLoja(payload)
        toast.success('Faturamento registrado com sucesso!')
      }
      form.reset({
        data: undefined as any,
        turno: undefined as any,
        loja: undefined as any,
        quantidade: 0,
        faturamento: '',
      })
    } catch (error) {
      toast.error('Erro ao salvar registro.')
    }
  }

  const handleEdit = (r: EntregaLoja) => {
    setEditingRecord(r)
    form.reset({
      data: new Date(r.data),
      turno: r.turno,
      loja: r.loja,
      quantidade: r.quantidade,
      faturamento: formatBRL((r.faturamento * 100).toFixed(0)),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deletingRecordId) return
    try {
      await deleteEntregaLoja(deletingRecordId)
      toast.success('Registro excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir registro.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    records.forEach((r) => months.add(format(new Date(r.data), 'yyyy-MM')))
    if (!months.has(format(new Date(), 'yyyy-MM'))) months.add(format(new Date(), 'yyyy-MM'))
    return Array.from(months).sort().reverse()
  }, [records])

  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const rDate = new Date(r.data)
      let matchDate = true

      if (monthFilter !== 'all') {
        matchDate = format(rDate, 'yyyy-MM') === monthFilter
      } else if (dateRange?.from) {
        const to = dateRange.to || dateRange.from
        matchDate = isWithinInterval(rDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(to),
        })
      }

      const matchStore = storeFilter === 'all' || r.loja === storeFilter
      const matchShift = shiftFilter === 'all' || r.turno === shiftFilter

      return matchDate && matchStore && matchShift
    })
  }, [records, dateRange, monthFilter, storeFilter, shiftFilter])

  const recentRecords = useMemo(() => filteredData.slice(0, 5), [filteredData])

  const groupedData = useMemo(() => {
    const group = filteredData.reduce(
      (acc, curr) => {
        if (!acc[curr.loja]) acc[curr.loja] = { quantidade: 0, faturamento: 0, records: [] }
        acc[curr.loja].quantidade += curr.quantidade
        acc[curr.loja].faturamento += curr.faturamento
        acc[curr.loja].records.push(curr)
        return acc
      },
      {} as Record<string, { quantidade: number; faturamento: number; records: EntregaLoja[] }>,
    )
    Object.values(group).forEach((g) =>
      g.records.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    )
    return group
  }, [filteredData])

  const grandTotal = useMemo(
    () =>
      filteredData.reduce(
        (acc, curr) => {
          acc.quantidade += curr.quantidade
          acc.faturamento += curr.faturamento
          return acc
        },
        { quantidade: 0, faturamento: 0 },
      ),
    [filteredData],
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faturamento</h2>
          <p className="text-muted-foreground">Registre e acompanhe as vendas por loja e turno.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <Select
            value={monthFilter}
            onValueChange={(val) => {
              setMonthFilter(val)
              if (val !== 'all') setDateRange(undefined)
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  <span className="capitalize">
                    {format(parseISO(`${m}-01`), 'MMM yyyy', { locale: ptBR })}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Todas as Lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Lojas</SelectItem>
              {STORES.map((s) => (
                <SelectItem key={`filter-${s}`} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Todos os Turnos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Turnos</SelectItem>
              <SelectItem value="Dia">Dia</SelectItem>
              <SelectItem value="Noite">Noite</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[240px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                  ) : (
                    format(dateRange.from, 'dd/MM/yy')
                  )
                ) : (
                  <span>Período customizado</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(val) => {
                  setDateRange(val)
                  setMonthFilter('all')
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                {editingRecord ? 'Editar Registro' : 'Novo Registro'}
              </span>
              {editingRecord && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingRecord(null)
                    form.reset({
                      data: undefined as any,
                      turno: undefined as any,
                      loja: undefined as any,
                      quantidade: 0,
                      faturamento: '',
                    })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>Insira os dados de faturamento diário.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
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
                            disabled={(d) => d > new Date() || d < new Date('1900-01-01')}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="turno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dia">Dia</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loja"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loja</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STORES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="faturamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faturamento (R$)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="R$ 0,00"
                            value={field.value}
                            onChange={(e) => field.onChange(formatBRL(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full mt-2">
                  <Save className="mr-2 h-4 w-4" />{' '}
                  {editingRecord ? 'Salvar Alterações' : 'Salvar Lançamento'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Últimos Lançamentos</CardTitle>
            <CardDescription>Seus 5 registros mais recentes nos filtros atuais.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      {isAdminOrManager && (
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {format(new Date(r.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {r.loja}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.turno}</TableCell>
                        <TableCell className="text-right">{r.quantidade}</TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {r.faturamento.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </TableCell>
                        {isAdminOrManager && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingRecordId(r.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Store className="h-10 w-10 mb-3 opacity-20" />
                <p>Nenhum lançamento encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdminOrManager && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Avançado de Faturamento</CardTitle>
            <CardDescription>Visão detalhada com subtotais por loja.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedData).length > 0 ? (
                    <>
                      {Object.entries(groupedData).map(([store, data]) => (
                        <React.Fragment key={store}>
                          {data.records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{format(new Date(r.data), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{r.turno}</TableCell>
                              <TableCell>{r.loja}</TableCell>
                              <TableCell className="text-right">{r.quantidade}</TableCell>
                              <TableCell className="text-right">
                                {r.faturamento.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeletingRecordId(r.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-primary/5 hover:bg-primary/5 font-medium border-b-2 border-border/50">
                            <TableCell colSpan={3} className="text-right text-primary">
                              Subtotal {store}
                            </TableCell>
                            <TableCell className="text-right text-primary">
                              {data.quantidade}
                            </TableCell>
                            <TableCell className="text-right text-primary">
                              {data.faturamento.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </React.Fragment>
                      ))}
                      <TableRow className="bg-muted hover:bg-muted font-bold text-base">
                        <TableCell colSpan={3} className="text-right uppercase tracking-wider">
                          Total Geral
                        </TableCell>
                        <TableCell className="text-right">{grandTotal.quantidade}</TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                          {grandTotal.faturamento.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum registro encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deletingRecordId}
        onOpenChange={(open) => !open && setDeletingRecordId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de faturamento? Esta ação não pode ser
              desfeita.
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
