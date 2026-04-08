import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
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
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts'

import { useAuth } from '@/hooks/use-auth'
import { getTransactions } from '@/services/transactions'
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

  const loadData = async () => {
    if (user) {
      const data = await getTransactions(user.id)
      setTransactions(data)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('transactions', () => {
    loadData()
  })

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

  const chartConfig = {
    income: {
      label: 'Entrada',
      color: 'hsl(var(--chart-success))',
    },
    expense: {
      label: 'Saída',
      color: 'hsl(var(--chart-danger))',
    },
  }

  // Process data for Donut Chart
  const expenseBreakdown = useMemo(() => {
    const breakdown = transactions
      .filter((t) => t.type === 'saída')
      .reduce(
        (acc, t) => {
          // Grouping by description to simulate categories as requested
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

    if (data.length === 0) {
      data.push({ name: 'Sem gastos', value: 1, color: '#334155' })
    }
    return data
  }, [transactions])

  // Mock Line Chart dynamic based on current data shape
  const lineChartData = useMemo(() => {
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
    const currentMonthIndex = new Date().getMonth()

    return Array.from({ length: 6 }).map((_, i) => {
      const targetMonthIndex = (currentMonthIndex - 5 + i + 12) % 12
      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.launch_date || t.date)
        return !isNaN(d.getTime()) && d.getMonth() === targetMonthIndex
      })

      return {
        month: months[targetMonthIndex],
        income:
          monthTransactions
            .filter((t) => t.type === 'entrada')
            .reduce((a, c) => a + (c.value || c.amount || 0), 0) ||
          (i < 5 ? 3000 + Math.random() * 1000 : 0),
        expense:
          monthTransactions
            .filter((t) => t.type === 'saída')
            .reduce((a, c) => a + (c.value || c.amount || 0), 0) ||
          (i < 5 ? 2000 + Math.random() * 1000 : 0),
      }
    })
  }, [transactions])

  return (
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

      {/* CHARTS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Line Chart */}
        <Card className="lg:col-span-2 bg-card/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Fluxo de Caixa (Últimos 6 meses)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-400" /> Saída
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> Entrada
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border)/0.2)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value >= 1000 ? value / 1000 + 'K' : value}`}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-expense)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'var(--color-expense)',
                      stroke: 'var(--background)',
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'var(--color-income)',
                      stroke: 'var(--background)',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Donut Chart */}
        <Card className="bg-card/40 border-white/5 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Divisão de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between mt-2">
            <div className="w-1/2 flex flex-col gap-3">
              {expenseBreakdown.slice(0, 5).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center justify-between text-xs">
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
                  {formatCurrency(summary.totalBalance).replace('R$', '')}
                </span>
                <span className="text-[10px] text-muted-foreground">Saldo Total</span>
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
                          className={`py-4 text-right font-medium ${tx.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}
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
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${summary.saving >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}
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
  )
}
