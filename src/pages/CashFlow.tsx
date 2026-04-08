import React, { useState, useEffect, useMemo } from 'react'
import { startOfMonth, endOfMonth, isBefore, isAfter, startOfDay, endOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDownCircle, ArrowUpCircle, Wallet, Activity, ArrowRightLeft } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

export default function CashFlow() {
  const [banks, setBanks] = useState<any[]>([])
  const [selectedBankId, setSelectedBankId] = useState<string>('all')
  const [transactions, setTransactions] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const banksData = await pb.collection('banks').getFullList({ sort: 'name' })
      setBanks(banksData)

      const txData = await pb.collection('transactions').getFullList({
        sort: 'launch_date',
        expand: 'bank',
      })
      setTransactions(txData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('banks', fetchData)
  useRealtime('transactions', fetchData)

  const processedData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null

    const from = startOfDay(dateRange.from)
    const to = endOfDay(dateRange.to)

    const activeBanks =
      selectedBankId === 'all' ? banks : banks.filter((b) => b.id === selectedBankId)

    const initialBalanceTotal = activeBanks.reduce((acc, b) => acc + (b.initial_balance || 0), 0)

    const bankTxs =
      selectedBankId === 'all'
        ? transactions
        : transactions.filter((t) => t.bank === selectedBankId)

    const pastTxs = bankTxs.filter((t) => isBefore(new Date(t.launch_date), from))

    const pastBalanceChange = pastTxs.reduce((acc, t) => {
      return acc + (t.type === 'entrada' ? t.value : -t.value)
    }, 0)

    let currentRunningBalance = initialBalanceTotal + pastBalanceChange

    const periodTxs = bankTxs
      .filter(
        (t) => !isBefore(new Date(t.launch_date), from) && !isAfter(new Date(t.launch_date), to),
      )
      .sort((a, b) => new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime())

    let totalInflow = 0
    let totalOutflow = 0

    const chartDataMap = new Map<string, number>()

    let currentDay = new Date(from)
    while (!isAfter(currentDay, to)) {
      chartDataMap.set(format(currentDay, 'yyyy-MM-dd'), 0)
      currentDay.setDate(currentDay.getDate() + 1)
    }

    let runningBal = currentRunningBalance

    const periodTxsByDay = periodTxs.reduce(
      (acc, t) => {
        const day = format(new Date(t.launch_date), 'yyyy-MM-dd')
        if (!acc[day]) acc[day] = []
        acc[day].push(t)
        return acc
      },
      {} as Record<string, any[]>,
    )

    const chartData = []

    for (const [day, _] of chartDataMap.entries()) {
      const dayTxs = periodTxsByDay[day] || []

      dayTxs.forEach((t) => {
        if (t.type === 'entrada') {
          totalInflow += t.value
          runningBal += t.value
        } else {
          totalOutflow += t.value
          runningBal -= t.value
        }
      })

      chartData.push({
        date: day,
        displayDate: format(new Date(day + 'T12:00:00'), 'dd/MM'),
        balance: runningBal,
      })
    }

    return {
      startBalance: currentRunningBalance,
      totalInflow,
      totalOutflow,
      periodBalance: totalInflow - totalOutflow,
      endBalance: runningBal,
      chartData,
      periodTxs: periodTxs.sort(
        (a, b) => new Date(b.launch_date).getTime() - new Date(a.launch_date).getTime(),
      ),
    }
  }, [banks, transactions, selectedBankId, dateRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        Carregando dados...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h2>
          <p className="text-muted-foreground mt-1">
            Monitore a evolução do saldo e histórico de movimentações.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecione um banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Bancos</SelectItem>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {processedData && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual (Final)</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    processedData.endBalance >= 0 ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {formatCurrency(processedData.endBalance)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(processedData.totalInflow)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">
                  {formatCurrency(processedData.totalOutflow)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado do Período</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    processedData.periodBalance >= 0 ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {processedData.periodBalance > 0 ? '+' : ''}
                  {formatCurrency(processedData.periodBalance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Evolução do Saldo</CardTitle>
              <CardDescription>
                Visualização diária do saldo acumulado no período selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ChartContainer
                config={{ balance: { label: 'Saldo', color: 'hsl(var(--primary))' } }}
                className="h-[300px] w-full"
              >
                <AreaChart
                  data={processedData.chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="displayDate"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value}`}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Movimentações detalhadas do período.</CardDescription>
            </CardHeader>
            <CardContent>
              {processedData.periodTxs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                  <ArrowRightLeft className="h-10 w-10 mb-4 opacity-20" />
                  <p>Nenhuma transação encontrada neste período.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        {selectedBankId === 'all' && <TableHead>Banco</TableHead>}
                        <TableHead className="w-[120px]">Tipo</TableHead>
                        <TableHead className="text-right w-[150px]">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.periodTxs.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {format(new Date(tx.launch_date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">{tx.description}</TableCell>
                          {selectedBankId === 'all' && (
                            <TableCell className="text-muted-foreground">
                              {tx.expand?.bank?.name || '-'}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'border-transparent font-medium',
                                tx.type === 'entrada'
                                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
                              )}
                            >
                              {tx.type === 'entrada' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              tx.type === 'entrada' ? 'text-emerald-500' : 'text-rose-500',
                            )}
                          >
                            {tx.type === 'entrada' ? '+' : '-'}
                            {formatCurrency(tx.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
