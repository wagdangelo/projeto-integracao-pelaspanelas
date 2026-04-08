import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Clock, MapPin, Phone, ShoppingBag, CheckCircle2, Store, Zap, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInMinutes, parseISO } from 'date-fns'

type OrderStatus = 'cozinha' | 'pronto' | 'entrega' | 'entregue'
type Marketplace = 'iFood' | '99Food' | 'Keeta' | 'Delivery Direto'

interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  createdAt: string
  totalValue: number
  marketplace: Marketplace
  paymentStatus: 'Pago' | 'Pendente'
  status: OrderStatus
}

const mkpConfig: Record<Marketplace, { color: string; icon: React.ElementType }> = {
  iFood: { color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800', icon: Utensils },
  '99Food': {
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800',
    icon: ShoppingBag,
  },
  Keeta: {
    color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800',
    icon: Zap,
  },
  'Delivery Direto': {
    color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    icon: Store,
  },
}

const COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: 'cozinha', title: 'Cozinha' },
  { id: 'pronto', title: 'Pedido Pronto' },
  { id: 'entrega', title: 'Saiu Para Entrega | Pronto para retirar' },
  { id: 'entregue', title: 'Entregue' },
]

const now = new Date()
const subMinutes = (date: Date, amount: number) => new Date(date.getTime() - amount * 60000)

const MOCK_ORDERS: Order[] = [
  {
    id: '#1045',
    customerName: 'João Silva',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123 - Apto 42, Centro',
    createdAt: subMinutes(now, 12).toISOString(),
    totalValue: 45.9,
    marketplace: 'iFood',
    paymentStatus: 'Pago',
    status: 'cozinha',
  },
  {
    id: '#1046',
    customerName: 'Maria Oliveira',
    phone: '(11) 91234-5678',
    address: 'Av Paulista, 1000 - Bela Vista',
    createdAt: subMinutes(now, 25).toISOString(),
    totalValue: 112.5,
    marketplace: 'Delivery Direto',
    paymentStatus: 'Pendente',
    status: 'cozinha',
  },
  {
    id: '#1047',
    customerName: 'Carlos Souza',
    phone: '(11) 99999-8888',
    address: 'Rua Augusta, 500 - Consolação',
    createdAt: subMinutes(now, 45).toISOString(),
    totalValue: 38.0,
    marketplace: '99Food',
    paymentStatus: 'Pago',
    status: 'pronto',
  },
  {
    id: '#1048',
    customerName: 'Ana Clara',
    phone: '(11) 97777-6666',
    address: 'Alameda Santos, 200 - Paraíso',
    createdAt: subMinutes(now, 60).toISOString(),
    totalValue: 89.9,
    marketplace: 'Keeta',
    paymentStatus: 'Pago',
    status: 'entrega',
  },
  {
    id: '#1049',
    customerName: 'Pedro Paulo',
    phone: '(11) 96666-5555',
    address: 'Rua Pamplona, 300 - Jd Paulista',
    createdAt: subMinutes(now, 120).toISOString(),
    totalValue: 65.4,
    marketplace: 'iFood',
    paymentStatus: 'Pago',
    status: 'entregue',
  },
  {
    id: '#1050',
    customerName: 'Juliana Costa',
    phone: '(11) 95555-4444',
    address: 'Rua Oscar Freire, 1500 - Pinheiros',
    createdAt: subMinutes(now, 5).toISOString(),
    totalValue: 150.0,
    marketplace: 'Delivery Direto',
    paymentStatus: 'Pago',
    status: 'cozinha',
  },
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [filterMkp, setFilterMkp] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>(now.toISOString().split('T')[0])
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('orderId', id)
  }

  const handleDrop = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('orderId')
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getElapsedTime = (createdAt: string) => {
    const mins = differenceInMinutes(new Date(), parseISO(createdAt))
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const filteredOrders = orders.filter((o) => {
    if (filterMkp !== 'all' && o.marketplace !== filterMkp) return false
    if (filterDate && !o.createdAt.startsWith(filterDate)) return false
    return true
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gerencie o fluxo de pedidos do delivery</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={filterMkp} onValueChange={setFilterMkp}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Marketplace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="iFood">iFood</SelectItem>
              <SelectItem value="99Food">99Food</SelectItem>
              <SelectItem value="Keeta">Keeta</SelectItem>
              <SelectItem value="Delivery Direto">Delivery Direto</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id)
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[320px] bg-secondary/30 border border-border/50 rounded-xl flex flex-col snap-start overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-4 border-b border-border/50 bg-secondary/50 flex items-center justify-between sticky top-0">
                <h3 className="font-semibold text-sm">{col.title}</h3>
                <Badge variant="secondary" className="bg-background">
                  {colOrders.length}
                </Badge>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {colOrders.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                    Nenhum pedido
                  </div>
                )}

                {colOrders.map((order) => {
                  const MkpIcon = mkpConfig[order.marketplace].icon
                  const elapsedMins = differenceInMinutes(new Date(), parseISO(order.createdAt))
                  const isDelayed = elapsedMins > 45 && order.status !== 'entregue'
                  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(parseISO(order.createdAt))

                  return (
                    <Card
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className={cn(
                        'cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm',
                        isDelayed && 'border-red-500/50',
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {order.id}
                            </span>
                            <span
                              className="text-sm font-semibold truncate max-w-[120px]"
                              title={order.customerName}
                            >
                              {order.customerName}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] whitespace-nowrap px-1.5 py-0',
                              mkpConfig[order.marketplace].color,
                            )}
                          >
                            <MkpIcon className="w-3 h-3 mr-1" />
                            {order.marketplace}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1.5 mb-3">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-muted-foreground/70" />{' '}
                            {order.phone}
                          </div>
                          <div className="flex items-start">
                            <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-muted-foreground/70" />{' '}
                            <span className="line-clamp-2">{order.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={order.paymentStatus === 'Pago' ? 'default' : 'secondary'}
                              className={cn(
                                'text-[10px] px-1.5 py-0',
                                order.paymentStatus === 'Pendente' &&
                                  'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                              )}
                            >
                              {order.paymentStatus}
                            </Badge>
                            <span className="text-sm font-bold">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(order.totalValue)}
                            </span>
                          </div>

                          <div
                            className={cn(
                              'flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full',
                              isDelayed
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-secondary text-secondary-foreground',
                            )}
                          >
                            {order.status === 'entregue' ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {formattedDate} • {getElapsedTime(order.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
