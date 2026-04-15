import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin, Camera, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

type TipoPonto = 'Entrada' | 'Saída Almoço' | 'Retorno Almoço' | 'Saída Final' | 'Completo'

export default function Ponto() {
  const { user, checkClockIn } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [status, setStatus] = useState<'idle' | 'locating' | 'camera' | 'registering' | 'success'>(
    'idle',
  )
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nextAction, setNextAction] = useState<TipoPonto>('Entrada')
  const [isLoadingState, setIsLoadingState] = useState(true)

  const role = user?.role?.toLowerCase() || ''
  const hasFinanceiroAccess = ['admin', 'gerente', 'administrativo', 'adm'].includes(role)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user?.id) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      supabase
        .from('pontos')
        .select('tipo_ponto')
        .eq('funcionario_id', user.id)
        .gte('data_hora', todayStart.toISOString())
        .then(({ data }) => {
          if (data) {
            const types = data.map((d: any) => d.tipo_ponto)
            if (!types.includes('Entrada')) setNextAction('Entrada')
            else if (!types.includes('Saída Almoço')) setNextAction('Saída Almoço')
            else if (!types.includes('Retorno Almoço')) setNextAction('Retorno Almoço')
            else if (!types.includes('Saída Final')) setNextAction('Saída Final')
            else setNextAction('Completo')
          }
          setIsLoadingState(false)
        })
    } else {
      setIsLoadingState(false)
    }
  }, [user?.id])

  const startProcess = () => {
    if (nextAction === 'Completo') {
      toast({ title: 'Aviso', description: 'Você já registrou todos os pontos de hoje.' })
      return
    }

    setStatus('locating')

    if (!navigator.geolocation) {
      toast({
        title: 'Erro',
        description: 'Geolocalização não suportada no seu navegador.',
        variant: 'destructive',
      })
      setStatus('idle')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ lat: latitude, lng: longitude })
        setStatus('camera')
        startCamera()
      },
      (err) => {
        console.warn(err)
        toast({
          title: 'Erro de localização',
          description: 'Por favor, permita o acesso à sua localização.',
          variant: 'destructive',
        })
        setStatus('idle')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      toast({
        title: 'Aviso',
        description:
          'Câmera não encontrada ou permissão negada. Você ainda pode registrar o ponto.',
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const registerPonto = async () => {
    setStatus('registering')

    let photoBase64 = ''
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        photoBase64 = canvas.toDataURL('image/jpeg', 0.8)
      }
    }

    stopCamera()

    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const dataStr = `${year}-${month}-${day}`

      const horas = now.getHours().toString().padStart(2, '0')
      const minutos = now.getMinutes().toString().padStart(2, '0')
      const horario = `${horas}:${minutos}`

      let statusValidacao = 'dentro_tolerancia'

      if (nextAction === 'Entrada') {
        const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
        const hoje = diasSemana[now.getDay()]

        let escala = user?.escala_turnos
        if (typeof escala === 'string') {
          try {
            escala = JSON.parse(escala)
          } catch (e) {}
        }

        const horarioEsperadoStr = escala?.[hoje] || user?.turno

        if (horarioEsperadoStr) {
          const timeMatch = horarioEsperadoStr.match(/(\d{2}):(\d{2})/)
          if (timeMatch) {
            const [_, hourStr, minuteStr] = timeMatch
            const expectedTotalMins = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10)
            const currentTotalMins = now.getHours() * 60 + now.getMinutes()

            let diff = currentTotalMins - expectedTotalMins
            if (diff < -12 * 60) diff += 24 * 60
            if (diff > 12 * 60) diff -= 24 * 60

            if (Math.abs(diff) > 15) {
              statusValidacao = 'fora_tolerancia'
            }
          }
        }
      }

      const payload = {
        funcionario_id: user?.id,
        tipo_ponto: nextAction,
        data_hora: now.toISOString(),
        data: dataStr,
        horario,
        status_validacao: statusValidacao,
        criado_em: now.toISOString(),
        entrada: horario, // legacy compat
        latitude: location?.lat,
        longitude: location?.lng,
        foto_url: photoBase64,
        wifi_conectado: true,
      } as any

      const { error } = await supabase.from('pontos').insert(payload)

      if (error) throw error

      await checkClockIn()

      setStatus('success')
      toast({
        title: 'Ponto registrado',
        description: `Seu registro de ${nextAction} foi salvo com sucesso!`,
      })

      if (nextAction === 'Entrada') setNextAction('Saída Almoço')
      else if (nextAction === 'Saída Almoço') setNextAction('Retorno Almoço')
      else if (nextAction === 'Retorno Almoço') setNextAction('Saída Final')
      else if (nextAction === 'Saída Final') setNextAction('Completo')
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Erro ao registrar ponto no sistema.',
        variant: 'destructive',
      })
      setStatus('camera')
      startCamera()
    }
  }

  if (isLoadingState) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            Registro de Ponto
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {nextAction === 'Completo'
              ? 'Você já completou todos os registros de hoje.'
              : `Próximo registro: ${nextAction}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-4">
          <div className="text-center space-y-2 bg-muted/30 p-6 rounded-2xl border border-border/50">
            <div className="text-6xl font-mono font-bold tracking-tighter text-foreground">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-muted-foreground text-lg font-medium">
              {currentTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {status === 'idle' && nextAction !== 'Completo' && (
            <Button
              size="lg"
              className="w-full h-16 text-xl font-semibold shadow-md transition-transform hover:scale-[1.02]"
              onClick={startProcess}
            >
              Registrar {nextAction}
            </Button>
          )}

          {status === 'idle' && nextAction === 'Completo' && hasFinanceiroAccess && (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 text-lg font-semibold group mt-4"
              onClick={() => navigate('/')}
            >
              Ir para o Sistema
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          {status === 'locating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-pulse">
              <div className="p-4 bg-primary/20 rounded-full">
                <MapPin className="w-12 h-12 text-primary" />
              </div>
              <p className="text-xl font-medium text-muted-foreground">
                Verificando localização...
              </p>
            </div>
          )}

          {(status === 'camera' || status === 'registering') && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-inner border border-border/50">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {status === 'registering' && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                      <span className="font-medium text-lg">Processando...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-1/3 h-16"
                  onClick={() => {
                    stopCamera()
                    setStatus('idle')
                  }}
                  disabled={status === 'registering'}
                >
                  Cancelar
                </Button>
                <Button
                  size="lg"
                  className="w-2/3 h-16 text-xl font-semibold shadow-md"
                  onClick={registerPonto}
                  disabled={status === 'registering'}
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Confirmar {nextAction}
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold text-green-500">Ponto Registrado!</h3>
                <p className="text-muted-foreground text-lg">Seu registro foi salvo com sucesso.</p>
              </div>

              <div className="flex gap-4 w-full">
                {nextAction !== 'Completo' && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-16 text-lg font-semibold"
                    onClick={() => setStatus('idle')}
                  >
                    Novo Registro
                  </Button>
                )}
                {hasFinanceiroAccess && (
                  <Button
                    size="lg"
                    className="w-full h-16 text-lg font-semibold group"
                    onClick={() => navigate('/')}
                  >
                    Ir para Sistema
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
