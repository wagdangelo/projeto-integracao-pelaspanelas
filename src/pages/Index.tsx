import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRightFromSquare,
  TrendingUpIcon,
  AlertCircle,
  PieChart,
} from 'lucide-react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ComposedChart,
  Bar,
  Line,
} from 'recharts'

import { useAuth } from '@/hooks/use-auth'
import { getTransactionsForDashboard } from '@/services/transactions'
import { getEntregasLojas } from '@/services/entregas_lojas'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function Index() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [entregas, setEntregas] = useState<any[]>([])
  const [faturamentoPeriod, setFaturamentoPeriod] = useState('mensal')
  const [dashboardPeriod, setDashboardPeriod] = useState<'tudo' | 'mes' | 'ano'>('tudo')

  const loadData = useCallback(async () => {
    if (user) {
      const [txData, enData] = await Promise.all([
        getTransactionsForDashboard(user.id, dashboardPeriod),
        getEntregasLojas().catch(() => []), // fallback to empty array if error
      ])
      setTransactions(txData)
      setEntregas(enData)
    }
  }, [user, dashboardPeriod])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('transactions', () => loadData())
  useRealtime('entregas_lojas', () => loadData())

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'entrada')
      .reduce((acc, curr) => acc + (curr.value || curr.amount || 0), 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'saída')
      .reduce((acc, curr) => acc + (curr.value || curr.amount || 0), 0)

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyIncome = transactions
      .filter((t) => {
        const d = new Date(t.launch_date || t.date)
        return (
          t.type === 'entrada' &&
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        )
      })
      .reduce((acc, curr) => acc + (curr.value || curr.amount || 0), 0)

    const monthlyExpense = transactions
      .filter((t) => {
        const d = new Date(t.launch_date || t.date)
        return (
          t.type === 'saída' &&
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        )
      })
      .reduce((acc, curr) => acc + (curr.value || curr.amount || 0), 0)

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      saving: monthlyIncome - monthlyExpense,
    }
  }, [transactions])

  // Data for Faturamento Chart (Composed Chart)
  const faturamentoData = useMemo(() => {
    const dates = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    let groupBy = 'day'
    if (faturamentoPeriod === 'semanal') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        dates.push(d)
      }
    } else if (faturamentoPeriod === 'mensal') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        dates.push(d)
      }
    } else {
      groupBy = 'month'
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        dates.push(d)
      }
    }

    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]

    return dates.map((date) => {
      let label = ''
      let matchFn: (d: Date) => boolean

      if (groupBy === 'month') {
        label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`
        matchFn = (d) => d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
      } else {
        label = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
        matchFn = (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      }

      const periodEntregas = entregas.filter((e) => {
        // Safe date parsing to avoid timezone shifts
        const ed = new Date(e.data.includes('T') ? e.data : `${e.data}T12:00:00`)
        return !isNaN(ed.getTime()) && matchFn(ed)
      })

      const faturamento = periodEntregas.reduce(
        (acc, curr) => acc + (Number(curr.faturamento) || 0),
        0,
      )
      const quantidade = periodEntregas.reduce(
        (acc, curr) => acc + (Number(curr.quantidade) || 0),
        0,
      )

      return { label, faturamento, quantidade }
    })
  }, [entregas, faturamentoPeriod])

  const chartConfigFaturamento = {
    faturamento: {
      label: 'Faturamento (R$)',
      color: 'hsl(var(--chart-success, 142.1 76.2% 36.3%))',
    },
    quantidade: {
      label: 'Qtd. Entregas',
      color: 'hsl(var(--chart-primary, 221.2 83.2% 53.3%))',
    },
  }

  // Data for Expense Breakdown Donut
  const expenseBreakdown = useMemo(() => {
    const breakdown = transactions
      .filter((t) => t.type === 'saída')
      .reduce(
        (acc, t) => {
          const desc = t.description
            ? t.description.length > 15
              ? t.description.substring(0, 15) + '...'
              : t.description
            : 'Sem descrição'
          acc[desc] = (acc[desc] || 0) + (t.value || t.amount || 0)
          return acc
        },
        {} as Record<string, number>,
      )

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B']

    const data = Object.entries(breakdown)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    if (data.length === 0) data.push({ name: 'Sem gastos', value: 1, color: '#334155' })
    return data
  }, [transactions])

  // Data for Revenue Breakdown Donut
  const revenueBreakdown = useMemo(() => {
    const breakdown = transactions
      .filter((t) => t.type === 'entrada')
      .reduce(
        (acc, t) => {
          const payeeName =
            t.payee?.name || t.expand?.payee?.name || t.description || 'Origem não informada'
          const name = payeeName.length > 15 ? payeeName.substring(0, 15) + '...' : payeeName
          acc[name] = (acc[name] || 0) + (t.value || t.amount || 0)
          return acc
        },
        {} as Record<string, number>,
      )

    const COLORS = ['#10B981', '#3B82F6', '#06B6D4', '#0EA5E9', '#14B8A6', '#64748B']

    const data = Object.entries(breakdown)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    if (data.length === 0) data.push({ name: 'Sem receitas', value: 1, color: '#334155' })
    return data
  }, [transactions])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 border border-white/5 p-4 rounded-xl shadow-xl backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Select value={dashboardPeriod} onValueChange={(v: any) => setDashboardPeriod(v)}>
            <SelectTrigger className="w-[160px] h-9 bg-background/50 border-white/10 text-sm">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tudo">Tudo</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Wallet className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                  <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                    {formatCurrency(summary.totalBalance)}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Renda Mensal</p>
                  <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                    {formatCurrency(summary.monthlyIncome)}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Mensais</p>
                  <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                    {formatCurrency(summary.monthlyExpense)}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/10 rounded-xl">
                  <PiggyBank className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Economia no Mês</p>
                  <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                    {formatCurrency(summary.saving)}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FATURAMENTO CHART (FULL WIDTH) */}
        <Card className="bg-card/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Faturamento (Entregas)</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={faturamentoPeriod} onValueChange={setFaturamentoPeriod}>
                <SelectTrigger className="w-[150px] h-8 text-xs bg-background/50 border-white/10">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Últimos 7 dias</SelectItem>
                  <SelectItem value="mensal">Últimos 30 dias</SelectItem>
                  <SelectItem value="anual">Últimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ChartContainer config={chartConfigFaturamento} className="h-full w-full">
                <ComposedChart
                  data={faturamentoData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border)/0.2)"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`
                    }
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="faturamento"
                    fill="var(--color-faturamento)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="quantidade"
                    stroke="var(--color-quantidade)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'var(--color-quantidade)',
                      stroke: 'var(--background)',
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* DONUT CHARTS ROW */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Divisão de Despesas */}
          <Card className="bg-card/40 border-white/5 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Divisão de Despesas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between mt-2">
              <div className="w-1/2 flex flex-col gap-3">
                {expenseBreakdown.slice(0, 5).map((entry, index) => (
                  <div
                    key={`legend-${index}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span
                        className="text-muted-foreground truncate max-w-[80px]"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-medium text-white pl-2">
                      {formatCurrency(entry.value).replace('R$', '')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-1/2 h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                  <span className="text-sm font-bold text-white truncate max-w-full">
                    {formatCurrency(
                      expenseBreakdown[0]?.name === 'Sem gastos'
                        ? 0
                        : expenseBreakdown.reduce((a, b) => a + b.value, 0),
                    ).replace('R$', '')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Total Despesas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Divisão de Receitas */}
          <Card className="bg-card/40 border-white/5 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Divisão de Receitas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between mt-2">
              <div className="w-1/2 flex flex-col gap-3">
                {revenueBreakdown.slice(0, 5).map((entry, index) => (
                  <div
                    key={`legend-${index}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span
                        className="text-muted-foreground truncate max-w-[80px]"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-medium text-white pl-2">
                      {formatCurrency(entry.value).replace('R$', '')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-1/2 h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                  <span className="text-sm font-bold text-white truncate max-w-full">
                    {formatCurrency(
                      revenueBreakdown[0]?.name === 'Sem receitas'
                        ? 0
                        : revenueBreakdown.reduce((a, b) => a + b.value, 0),
                    ).replace('R$', '')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Total Receitas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2 bg-card/40 border-white/5 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/50 border-white/10"
              >
                <ArrowUpRightFromSquare className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {transactions.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground border-b border-white/10">
                      <tr>
                        <th className="pb-3 font-medium">Data</th>
                        <th className="pb-3 font-medium">Descrição</th>
                        <th className="pb-3 font-medium">Banco</th>
                        <th className="pb-3 font-medium text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 text-muted-foreground">
                            {formatDate(tx.launch_date || tx.date)}
                          </td>
                          <td className="py-4 font-medium text-white">{tx.description}</td>
                          <td className="py-4 text-muted-foreground">
                            {tx.expand?.bank?.name || '-'}
                          </td>
                          <td
                            className={`py-4 text-right font-medium ${
                              tx.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'entrada' ? '+' : '-'}
                            {formatCurrency(tx.value || tx.amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma transação encontrada.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spending Insights */}
          <Card className="bg-card/40 border-white/5 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Insights Rápidos</CardTitle>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/50 border-white/10"
              >
                <ArrowUpRightFromSquare className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0 mt-0.5">
                  <TrendingUpIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {summary.saving >= 0 ? 'Bom desempenho no mês' : 'Alerta de gastos no mês'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        summary.saving >= 0
                          ? 'text-emerald-400 bg-emerald-400/10'
                          : 'text-rose-400 bg-rose-400/10'
                      }`}
                    >
                      {summary.saving >= 0 ? '+' : ''}
                      {formatCurrency(summary.saving)}
                    </span>
                    <span className="text-xs text-muted-foreground">de fluxo de caixa</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                <div className="p-2 bg-sky-500/20 rounded-lg shrink-0 mt-0.5">
                  <PieChart className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Maior gasto registrado:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expenseBreakdown.length > 0 && expenseBreakdown[0].name !== 'Sem gastos'
                      ? expenseBreakdown[0].name
                      : 'Nenhum'}{' '}
                    <span className="font-medium text-white ml-1">
                      {expenseBreakdown.length > 0 && expenseBreakdown[0].name !== 'Sem gastos'
                        ? '-' + formatCurrency(expenseBreakdown[0].value)
                        : ''}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 transition-colors hover:bg-rose-500/20">
                <div className="p-2 bg-rose-500/20 rounded-lg shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-100">Atualização de Sistema</p>
                  <p className="text-xs text-rose-200/70 mt-1">
                    Os dados apresentados são diretamente sincronizados com seu perfil de{' '}
                    {user?.role || 'Usuário'}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
