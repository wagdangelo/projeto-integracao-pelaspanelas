import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Store,
  Save,
  Filter,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { supabase } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/use-realtime'

const formatBRL = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
const parseBRL = (value: string) => parseInt(value.replace(/\D/g, '') || '0', 10) / 100

const formatCurrency = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatNumber = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

const formSchema = z.object({
  data: z.date({ required_error: 'A data é obrigatória.' }),
  turno: z.enum(['Dia', 'Noite'], { required_error: 'O turno é obrigatório.' }),
  loja: z.string({ required_error: 'A loja é obrigatória.' }).min(1, 'A loja é obrigatória.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  faturamento: z.string().min(1, 'O faturamento é obrigatório.'),
})

export default function Billing() {
  const { user } = useAuth()
  const role = user?.role?.toLowerCase() || ''
  const isAdminOrManager = ['admin', 'gerente'].includes(role)

  const [records, setRecords] = useState<EntregaLoja[]>([])
  const [stores, setStores] = useState<{ id: string; nome_fantasia: string }[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [shiftFilter, setShiftFilter] = useState<string>('all')

  const [editingRecord, setEditingRecord] = useState<EntregaLoja | null>(null)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const nextMonth = () => setCalendarMonth(addMonths(calendarMonth, 1))
  const prevMonth = () => setCalendarMonth(subMonths(calendarMonth, 1))

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const calendarData = useMemo(() => {
    const data: Record<string, { faturamento: number; quantidade: number }> = {}

    const relevantRecords = records.filter((r) => {
      const matchStore = storeFilter === 'all' || r.loja === storeFilter
      const matchShift = shiftFilter === 'all' || r.turno === shiftFilter
      return matchStore && matchShift
    })

    relevantRecords.forEach((r) => {
      const dStr = format(new Date(r.data), 'yyyy-MM-dd')
      if (!data[dStr]) {
        data[dStr] = { faturamento: 0, quantidade: 0 }
      }
      data[dStr].faturamento += r.faturamento
      data[dStr].quantidade += r.quantidade
    })

    return data
  }, [records, storeFilter, shiftFilter])

  const groupedSelectedDayRecords = useMemo(() => {
    if (!selectedDay) return []

    const grouped: Record<
      string,
      { loja: string; turno: string; quantidade: number; faturamento: number }
    > = {}

    records.forEach((r) => {
      const matchDate = format(new Date(r.data), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
      const matchStore = storeFilter === 'all' || r.loja === storeFilter
      const matchShift = shiftFilter === 'all' || r.turno === shiftFilter

      if (matchDate && matchStore && matchShift) {
        const key = `${r.loja}-${r.turno}`
        if (!grouped[key]) {
          grouped[key] = { loja: r.loja, turno: r.turno, quantidade: 0, faturamento: 0 }
        }
        grouped[key].quantidade += r.quantidade
        grouped[key].faturamento += r.faturamento
      }
    })

    return Object.values(grouped).sort(
      (a, b) => a.loja.localeCompare(b.loja) || a.turno.localeCompare(b.turno),
    )
  }, [selectedDay, records, storeFilter, shiftFilter])

  const loadData = async () => {
    try {
      const [entregasData, lojasData] = await Promise.all([
        getEntregasLojas(),
        supabase.from('lojas').select('id, nome_fantasia').order('nome_fantasia'),
      ])

      let finalRecords = entregasData
      if (['administrativo', 'adm'].includes(role)) {
        finalRecords = finalRecords.filter((r) => r.user_id === user?.id)
      }

      setRecords(finalRecords)
      if (lojasData.data) {
        setStores(lojasData.data)
      }
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

  // PIVOT TABLE LOGIC
  const pivotDates = useMemo(() => {
    const dates = new Set<string>()
    filteredData.forEach((r) => dates.add(format(new Date(r.data), 'yyyy-MM-dd')))
    return Array.from(dates).sort((a, b) => b.localeCompare(a))
  }, [filteredData])

  const pivotRows = useMemo(() => {
    return pivotDates.map((dateStr) => {
      const rowRecords = filteredData.filter(
        (r) => format(new Date(r.data), 'yyyy-MM-dd') === dateStr,
      )

      const row: any = {
        date: dateStr,
        stores: {},
        totais: {
          diaQtd: 0,
          diaVal: 0,
          noiteQtd: 0,
          noiteVal: 0,
          geralQtd: 0,
          geralVal: 0,
        },
      }

      stores.forEach((store) => {
        const storeRecords = rowRecords.filter((r) => r.loja === store.nome_fantasia)
        const dia = storeRecords.filter((r) => r.turno === 'Dia')
        const noite = storeRecords.filter((r) => r.turno === 'Noite')

        const diaQtd = dia.reduce((sum, r) => sum + r.quantidade, 0)
        const diaVal = dia.reduce((sum, r) => sum + r.faturamento, 0)
        const noiteQtd = noite.reduce((sum, r) => sum + r.quantidade, 0)
        const noiteVal = noite.reduce((sum, r) => sum + r.faturamento, 0)

        row.stores[store.nome_fantasia] = {
          diaQtd,
          diaVal,
          noiteQtd,
          noiteVal,
        }

        row.totais.diaQtd += diaQtd
        row.totais.diaVal += diaVal
        row.totais.noiteQtd += noiteQtd
        row.totais.noiteVal += noiteVal
      })

      row.totais.geralQtd = row.totais.diaQtd + row.totais.noiteQtd
      row.totais.geralVal = row.totais.diaVal + row.totais.noiteVal

      return row
    })
  }, [pivotDates, filteredData, stores])

  const summary = useMemo(() => {
    const total = {
      stores: {} as Record<string, any>,
      totais: {
        diaQtd: 0,
        diaVal: 0,
        noiteQtd: 0,
        noiteVal: 0,
        geralQtd: 0,
        geralVal: 0,
      },
    }

    stores.forEach((store) => {
      total.stores[store.nome_fantasia] = {
        diaQtd: 0,
        diaVal: 0,
        noiteQtd: 0,
        noiteVal: 0,
      }
    })

    pivotRows.forEach((row) => {
      stores.forEach((store) => {
        total.stores[store.nome_fantasia].diaQtd += row.stores[store.nome_fantasia].diaQtd
        total.stores[store.nome_fantasia].diaVal += row.stores[store.nome_fantasia].diaVal
        total.stores[store.nome_fantasia].noiteQtd += row.stores[store.nome_fantasia].noiteQtd
        total.stores[store.nome_fantasia].noiteVal += row.stores[store.nome_fantasia].noiteVal
      })

      total.totais.diaQtd += row.totais.diaQtd
      total.totais.diaVal += row.totais.diaVal
      total.totais.noiteQtd += row.totais.noiteQtd
      total.totais.noiteVal += row.totais.noiteVal
    })

    total.totais.geralQtd = total.totais.diaQtd + total.totais.noiteQtd
    total.totais.geralVal = total.totais.diaVal + total.totais.noiteVal

    const daysCount = pivotRows.length || 1

    const media = {
      stores: {} as Record<string, any>,
      totais: {
        diaQtd: total.totais.diaQtd / daysCount,
        diaVal: total.totais.diaVal / daysCount,
        noiteQtd: total.totais.noiteQtd / daysCount,
        noiteVal: total.totais.noiteVal / daysCount,
        geralQtd: total.totais.geralQtd / daysCount,
        geralVal: total.totais.geralVal / daysCount,
      },
    }

    const ticket = {
      stores: {} as Record<string, any>,
      totais: {
        diaQtd: 0,
        diaVal: total.totais.diaQtd > 0 ? total.totais.diaVal / total.totais.diaQtd : 0,
        noiteQtd: 0,
        noiteVal: total.totais.noiteQtd > 0 ? total.totais.noiteVal / total.totais.noiteQtd : 0,
        geralQtd: 0,
        geralVal: total.totais.geralQtd > 0 ? total.totais.geralVal / total.totais.geralQtd : 0,
      },
    }

    stores.forEach((store) => {
      const s = total.stores[store.nome_fantasia]
      media.stores[store.nome_fantasia] = {
        diaQtd: s.diaQtd / daysCount,
        diaVal: s.diaVal / daysCount,
        noiteQtd: s.noiteQtd / daysCount,
        noiteVal: s.noiteVal / daysCount,
      }
      ticket.stores[store.nome_fantasia] = {
        diaQtd: 0,
        diaVal: s.diaQtd > 0 ? s.diaVal / s.diaQtd : 0,
        noiteQtd: 0,
        noiteVal: s.noiteQtd > 0 ? s.noiteVal / s.noiteQtd : 0,
      }
    })

    return { total, media, ticket }
  }, [pivotRows, stores])

  return (
    <div className="space-y-6 max-w-full mx-auto pb-10">
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
              {stores.map((s) => (
                <SelectItem key={`filter-${s.id}`} value={s.nome_fantasia}>
                  {s.nome_fantasia}
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
                            {stores.map((s) => (
                              <SelectItem key={s.id} value={s.nome_fantasia}>
                                {s.nome_fantasia}
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
            <CardDescription>Seus registros mais recentes nos filtros atuais.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
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
                        <TableCell className="font-medium whitespace-nowrap">
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
                          {formatCurrency(r.faturamento)}
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

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Calendário de Faturamento</CardTitle>
            <CardDescription>Visão diária do faturamento e pedidos.</CardDescription>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center capitalize">
              {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
              <div
                key={dayName}
                className="bg-muted/50 p-2 text-center text-xs font-semibold uppercase tracking-wider"
              >
                {dayName}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dStr = format(day, 'yyyy-MM-dd')
              const metrics = calendarData[dStr]
              const isCurrentMonth = isSameMonth(day, calendarMonth)

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'bg-background p-1 sm:p-2 min-h-[100px] flex flex-col cursor-pointer hover:bg-muted/50 transition-colors relative group',
                    !isCurrentMonth && 'text-muted-foreground opacity-60 bg-muted/20',
                    isToday(day) && 'ring-2 ring-primary ring-inset z-10',
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <div
                    className={cn(
                      'font-semibold text-xs sm:text-sm mb-1 sm:mb-2 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday(day) && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {metrics && metrics.quantidade > 0 && (
                    <div className="flex flex-col gap-1 text-[10px] sm:text-xs mt-auto">
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1 py-0.5 rounded">
                        <span className="hidden sm:inline">R$</span>
                        <span>{formatCurrency(metrics.faturamento).replace('R$', '').trim()}</span>
                      </div>
                      <div className="flex justify-between items-center text-primary bg-primary/10 px-1 py-0.5 rounded">
                        <span className="hidden sm:inline">Qtd</span>
                        <span>{metrics.quantidade}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground bg-muted px-1 py-0.5 rounded">
                        <span className="hidden sm:inline">TM</span>
                        <span>
                          {formatCurrency(metrics.faturamento / metrics.quantidade)
                            .replace('R$', '')
                            .trim()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isAdminOrManager && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Avançado de Faturamento (Pivot)</CardTitle>
            <CardDescription>
              Visão consolidada de todas as lojas cadastradas por data e turno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto pb-2">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      rowSpan={2}
                      className="align-middle border-r bg-muted/50 min-w-[100px]"
                    >
                      Data
                    </TableHead>
                    {stores.map((s) => (
                      <TableHead
                        key={s.id}
                        colSpan={4}
                        className="text-center border-r bg-muted/30 font-semibold"
                      >
                        {s.nome_fantasia}
                      </TableHead>
                    ))}
                    <TableHead
                      colSpan={2}
                      className="text-center border-r bg-primary/5 text-primary"
                    >
                      Total Dia
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center border-r bg-primary/5 text-primary"
                    >
                      Total Noite
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="text-center bg-primary/10 text-primary font-bold"
                    >
                      Total Geral
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {stores.map((s) => (
                      <React.Fragment key={`${s.id}-sub`}>
                        <TableHead className="text-right text-xs bg-muted/10">Dia Qtd</TableHead>
                        <TableHead className="text-right text-xs border-r bg-muted/10">
                          Dia R$
                        </TableHead>
                        <TableHead className="text-right text-xs bg-muted/10">Noite Qtd</TableHead>
                        <TableHead className="text-right text-xs border-r bg-muted/10">
                          Noite R$
                        </TableHead>
                      </React.Fragment>
                    ))}
                    <TableHead className="text-right text-xs bg-primary/5">Qtd</TableHead>
                    <TableHead className="text-right text-xs border-r bg-primary/5">R$</TableHead>
                    <TableHead className="text-right text-xs bg-primary/5">Qtd</TableHead>
                    <TableHead className="text-right text-xs border-r bg-primary/5">R$</TableHead>
                    <TableHead className="text-right text-xs bg-primary/10 font-bold">
                      Qtd
                    </TableHead>
                    <TableHead className="text-right text-xs bg-primary/10 font-bold">R$</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotRows.length > 0 ? (
                    pivotRows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="border-r whitespace-nowrap font-medium bg-background/50 sticky left-0 z-10">
                          {format(parseISO(row.date), 'dd/MM/yyyy')}
                        </TableCell>
                        {stores.map((s) => {
                          const data = row.stores[s.nome_fantasia]
                          return (
                            <React.Fragment key={s.id}>
                              <TableCell className="text-right text-muted-foreground">
                                {data.diaQtd || '-'}
                              </TableCell>
                              <TableCell className="text-right border-r">
                                {data.diaVal ? formatCurrency(data.diaVal) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {data.noiteQtd || '-'}
                              </TableCell>
                              <TableCell className="text-right border-r">
                                {data.noiteVal ? formatCurrency(data.noiteVal) : '-'}
                              </TableCell>
                            </React.Fragment>
                          )
                        })}
                        <TableCell className="text-right bg-primary/5/30">
                          {row.totais.diaQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right border-r bg-primary/5/30 font-medium">
                          {row.totais.diaVal ? formatCurrency(row.totais.diaVal) : '-'}
                        </TableCell>
                        <TableCell className="text-right bg-primary/5/30">
                          {row.totais.noiteQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right border-r bg-primary/5/30 font-medium">
                          {row.totais.noiteVal ? formatCurrency(row.totais.noiteVal) : '-'}
                        </TableCell>
                        <TableCell className="text-right bg-primary/10/30 font-bold">
                          {row.totais.geralQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right bg-primary/10/30 font-bold text-emerald-600 dark:text-emerald-400">
                          {row.totais.geralVal ? formatCurrency(row.totais.geralVal) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={1 + stores.length * 4 + 6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Nenhum registro encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}

                  {pivotRows.length > 0 && (
                    <>
                      {/* TOTAL */}
                      <TableRow className="bg-rose-100 dark:bg-rose-950/30 hover:bg-rose-100/90 dark:hover:bg-rose-950/40 font-bold">
                        <TableCell className="border-r whitespace-nowrap text-rose-900 dark:text-rose-100 sticky left-0 z-10 bg-rose-100 dark:bg-[#3f1f23]">
                          TOTAL
                        </TableCell>
                        {stores.map((s) => {
                          const data = summary.total.stores[s.nome_fantasia]
                          return (
                            <React.Fragment key={`total-${s.id}`}>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                {data.diaQtd || '-'}
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.diaVal ? formatCurrency(data.diaVal) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                {data.noiteQtd || '-'}
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.noiteVal ? formatCurrency(data.noiteVal) : '-'}
                              </TableCell>
                            </React.Fragment>
                          )
                        })}
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          {summary.total.totais.diaQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.total.totais.diaVal
                            ? formatCurrency(summary.total.totais.diaVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          {summary.total.totais.noiteQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.total.totais.noiteVal
                            ? formatCurrency(summary.total.totais.noiteVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100 text-base">
                          {summary.total.totais.geralQtd || '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100 text-base">
                          {summary.total.totais.geralVal
                            ? formatCurrency(summary.total.totais.geralVal)
                            : '-'}
                        </TableCell>
                      </TableRow>

                      {/* MÉDIA */}
                      <TableRow className="bg-rose-100 dark:bg-rose-950/30 hover:bg-rose-100/90 dark:hover:bg-rose-950/40 font-bold">
                        <TableCell className="border-r whitespace-nowrap text-rose-900 dark:text-rose-100 sticky left-0 z-10 bg-rose-100 dark:bg-[#3f1f23]">
                          MÉDIA
                        </TableCell>
                        {stores.map((s) => {
                          const data = summary.media.stores[s.nome_fantasia]
                          return (
                            <React.Fragment key={`media-${s.id}`}>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                {data.diaQtd ? formatNumber(data.diaQtd) : '-'}
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.diaVal ? formatCurrency(data.diaVal) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                {data.noiteQtd ? formatNumber(data.noiteQtd) : '-'}
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.noiteVal ? formatCurrency(data.noiteVal) : '-'}
                              </TableCell>
                            </React.Fragment>
                          )
                        })}
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          {summary.media.totais.diaQtd
                            ? formatNumber(summary.media.totais.diaQtd)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.media.totais.diaVal
                            ? formatCurrency(summary.media.totais.diaVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          {summary.media.totais.noiteQtd
                            ? formatNumber(summary.media.totais.noiteQtd)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.media.totais.noiteVal
                            ? formatCurrency(summary.media.totais.noiteVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100">
                          {summary.media.totais.geralQtd
                            ? formatNumber(summary.media.totais.geralQtd)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100">
                          {summary.media.totais.geralVal
                            ? formatCurrency(summary.media.totais.geralVal)
                            : '-'}
                        </TableCell>
                      </TableRow>

                      {/* TICKET */}
                      <TableRow className="bg-rose-100 dark:bg-rose-950/30 hover:bg-rose-100/90 dark:hover:bg-rose-950/40 font-bold border-b-2 border-rose-300 dark:border-rose-800">
                        <TableCell className="border-r whitespace-nowrap text-rose-900 dark:text-rose-100 sticky left-0 z-10 bg-rose-100 dark:bg-[#3f1f23]">
                          TICKET
                        </TableCell>
                        {stores.map((s) => {
                          const data = summary.ticket.stores[s.nome_fantasia]
                          return (
                            <React.Fragment key={`ticket-${s.id}`}>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                -
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.diaVal ? formatCurrency(data.diaVal) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                                -
                              </TableCell>
                              <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                                {data.noiteVal ? formatCurrency(data.noiteVal) : '-'}
                              </TableCell>
                            </React.Fragment>
                          )
                        })}
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          -
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.ticket.totais.diaVal
                            ? formatCurrency(summary.ticket.totais.diaVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-800 dark:text-rose-200/80">
                          -
                        </TableCell>
                        <TableCell className="text-right border-r text-rose-900 dark:text-rose-100">
                          {summary.ticket.totais.noiteVal
                            ? formatCurrency(summary.ticket.totais.noiteVal)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100">
                          -
                        </TableCell>
                        <TableCell className="text-right text-rose-900 dark:text-rose-100">
                          {summary.ticket.totais.geralVal
                            ? formatCurrency(summary.ticket.totais.geralVal)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhamento - {selectedDay ? format(selectedDay, 'dd/MM/yyyy') : ''}
            </DialogTitle>
            <DialogDescription>Faturamento detalhado por loja e turno.</DialogDescription>
          </DialogHeader>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedSelectedDayRecords.length > 0 ? (
                  groupedSelectedDayRecords.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.loja}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.turno}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.quantidade}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.faturamento)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(r.quantidade > 0 ? r.faturamento / r.quantidade : 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum registro encontrado para este dia nos filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
