import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { CalendarDays, Clock, ListTodo, Megaphone, CheckCircle2, Circle } from 'lucide-react'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PontoRecord {
  id: string
  data: string
  tipo_ponto: string
  horario: string
}

interface ProcessedDay {
  data: string
  entrada: string
  saida_almoco: string
  retorno_almoco: string
  saida_final: string
}

const mockInformativos = [
  {
    id: 1,
    title: 'Nova política de uniformes',
    description:
      'A partir da próxima segunda-feira, será obrigatório o uso do novo uniforme padrão para toda a equipe.',
    date: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Feriado Nacional',
    description:
      'Informamos que no próximo feriado o restaurante funcionará em horário especial, das 11h às 16h.',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 3,
    title: 'Treinamento de Segurança',
    description:
      'O treinamento obrigatório de segurança alimentar ocorrerá na sexta-feira. Consulte seu gerente para o horário.',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const initialTasks = [
  { id: 1, title: 'Limpeza e organização da bancada de trabalho', completed: false },
  { id: 2, title: 'Verificação do estoque diário e validade dos produtos', completed: true },
  { id: 3, title: 'Higienização dos utensílios principais', completed: false },
  { id: 4, title: 'Revisão das metas e pedidos do dia', completed: false },
  { id: 5, title: 'Lançamento de notas fiscais do turno da manhã', completed: true },
]

export default function PersonalDashboard() {
  const { user } = useAuth()
  const [pontos, setPontos] = useState<ProcessedDay[]>([])
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    if (user?.id) {
      fetchPontos()
    }
  }, [user?.id])

  const fetchPontos = async () => {
    setLoading(true)
    const start = startOfMonth(new Date()).toISOString()
    const end = endOfMonth(new Date()).toISOString()

    const { data, error } = await supabase
      .from('pontos')
      .select('id, data, tipo_ponto, horario, data_hora')
      .eq('funcionario_id', user.id)
      .gte('data_hora', start)
      .lte('data_hora', end)
      .order('data_hora', { ascending: true })

    if (!error && data) {
      const grouped = data.reduce((acc: Record<string, ProcessedDay>, curr) => {
        const date = curr.data || curr.data_hora?.substring(0, 10) || ''
        if (!date) return acc

        if (!acc[date]) {
          acc[date] = {
            data: date,
            entrada: '-',
            saida_almoco: '-',
            retorno_almoco: '-',
            saida_final: '-',
          }
        }

        const tipo = curr.tipo_ponto?.toLowerCase() || ''
        if (tipo === 'entrada') acc[date].entrada = curr.horario || '-'
        if (tipo === 'saida_almoco' || tipo === 'saída almoço')
          acc[date].saida_almoco = curr.horario || '-'
        if (tipo === 'retorno_almoco' || tipo === 'retorno almoço')
          acc[date].retorno_almoco = curr.horario || '-'
        if (tipo === 'saida_final' || tipo === 'saída final')
          acc[date].saida_final = curr.horario || '-'

        return acc
      }, {})

      setPontos(
        Object.values(grouped).sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
        ),
      )
    }
    setLoading(false)
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr === '-') return '-'
    if (timeStr.includes('T')) {
      return format(parseISO(timeStr), 'HH:mm')
    }
    const match = timeStr.match(/\d{2}:\d{2}/)
    return match ? match[0] : timeStr
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meu Painel</h2>
        <p className="text-muted-foreground mt-1">Bem-vindo(a), {user?.name || user?.email}</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Espelho de Pontos */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Espelho de Ponto - {format(new Date(), 'MMMM/yyyy', { locale: ptBR })}
            </CardTitle>
            <CardDescription>Seus registros de entrada e saída deste mês.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pontos.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">
                  Nenhum ponto registrado neste mês.
                </div>
              ) : (
                <div className="space-y-4">
                  {pontos.map((dia, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 space-y-2 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-semibold border-b pb-2 mb-2 text-sm text-muted-foreground capitalize">
                        {format(parseISO(dia.data), "dd 'de' MMMM, EEEE", { locale: ptBR })}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs font-medium">Entrada</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatTime(dia.entrada)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium">Saída Almoço</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatTime(dia.saida_almoco)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium">
                            Retorno Almoço
                          </p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatTime(dia.retorno_almoco)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium">Saída Final</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatTime(dia.saida_final)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tarefas e Informativos */}
        <div className="col-span-1 space-y-6 flex flex-col h-[500px]">
          {/* Tarefas do Dia */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo className="h-5 w-5 text-primary" />
                Tarefas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mural de Informativos */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-primary" />
                Mural de Informativos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {mockInformativos.map((info) => (
                    <div key={info.id} className="border-l-2 border-primary pl-3 py-1">
                      <h4 className="text-sm font-semibold">{info.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {info.description}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 block mt-2 font-medium">
                        {format(parseISO(info.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
