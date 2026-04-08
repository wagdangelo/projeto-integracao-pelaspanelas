import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  CheckCircle2,
  Store,
  Zap,
  Utensils,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInMinutes, parseISO, format } from 'date-fns'
import { ordersService, type Order } from '@/services/orders'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

type OrderStatus = 'Cozinha' | 'Pedido Pronto' | 'Saiu Para Entrega' | 'Entregue'

const mkpConfig: Record<string, { color: string; icon: React.ElementType }> = {
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
  { id: 'Cozinha', title: 'Cozinha' },
  { id: 'Pedido Pronto', title: 'Pedido Pronto' },
  { id: 'Saiu Para Entrega', title: 'Saiu Para Entrega | Pronto para retirar' },
  { id: 'Entregue', title: 'Entregue' },
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMkp, setFilterMkp] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [, setTick] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersService.getOrders()
      setOrders(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSyncIfood = async () => {
    try {
      setSyncing(true)
      const res = await ordersService.syncIfoodOrders()
      toast({
        title: 'Sincronização concluída',
        description: `${res?.synced || 0} pedidos sincronizados. ${res?.message ? `(${res.message})` : ''}`,
      })
      if (res?.errors && res.errors.length > 0) {
        console.error('Erros na sincronização:', res.errors)
      }
      fetchOrders()
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar com o iFood.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  useRealtime('orders', (payload) => {
    if (payload.action === 'create') {
      setOrders((prev) => [payload.record as Order, ...prev])
    } else if (payload.action === 'update') {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.record.id ? (payload.record as Order) : o)),
      )
    } else if (payload.action === 'delete') {
      setOrders((prev) => prev.filter((o) => o.id !== payload.record.id))
    }
  })

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('orderId', id)
  }

  const handleDrop = async (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('orderId')

    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))

    try {
      await ordersService.updateOrderStatus(id, status)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'O status do pedido não pôde ser atualizado.',
        variant: 'destructive',
      })
      fetchOrders() // revert
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getElapsedTime = (dateString: string) => {
    const mins = differenceInMinutes(new Date(), parseISO(dateString))
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const filteredOrders = orders.filter((o) => {
    if (filterMkp !== 'all' && o.marketplace !== filterMkp) return false
    if (filterDate) {
      try {
        const orderDateStr = format(parseISO(o.order_date), 'yyyy-MM-dd')
        if (orderDateStr !== filterDate) return false
      } catch {
        return false
      }
    }
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncIfood}
            disabled={syncing}
            className="hidden sm:flex"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
            Sincronizar iFood
          </Button>
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

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Carregando pedidos...
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id)
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-[320px] bg-secondary/30 border border-border/50 rounded-xl flex flex-col snap-start overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id as OrderStatus)}
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
                    const mkpConf = mkpConfig[order.marketplace] || {
                      color: 'bg-muted text-muted-foreground',
                      icon: AlertCircle,
                    }
                    const MkpIcon = mkpConf.icon
                    const elapsedMins = differenceInMinutes(new Date(), parseISO(order.order_date))
                    const isDelayed = elapsedMins > 45 && order.status !== 'Entregue'
                    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(parseISO(order.order_date))

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
                                {order.order_number}
                              </span>
                              <span
                                className="text-sm font-semibold truncate max-w-[120px]"
                                title={order.customer_name}
                              >
                                {order.customer_name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] whitespace-nowrap px-1.5 py-0',
                                mkpConf.color,
                              )}
                            >
                              <MkpIcon className="w-3 h-3 mr-1" />
                              {order.marketplace}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1.5 mb-3">
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1.5 text-muted-foreground/70" />{' '}
                              {order.customer_phone || 'Não informado'}
                            </div>
                            <div className="flex items-start">
                              <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-muted-foreground/70" />{' '}
                              <span className="line-clamp-2">
                                {order.customer_address || 'Não informado'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={order.payment_status === 'Pago' ? 'default' : 'secondary'}
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  order.payment_status === 'Pendente' &&
                                    'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                                )}
                              >
                                {order.payment_status}
                              </Badge>
                              <span className="text-sm font-bold">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(order.total_value)}
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
                              {order.status === 'Entregue' ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {formattedDate} • {getElapsedTime(order.order_date)}
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
      )}
    </div>
  )
}
