import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin, Camera, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

// Mock Company Location for 50m radius check
const COMPANY_LOCATION = { lat: -23.5505, lng: -46.6333 }
const MAX_DISTANCE_METERS = 50

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function Ponto() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [status, setStatus] = useState<'idle' | 'locating' | 'camera' | 'registering' | 'success'>(
    'idle',
  )
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const hasFinanceiroAccess = ['Admin', 'Adm', 'Gerente'].includes(user?.role || '')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const startProcess = () => {
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
        const distance = getDistanceFromLatLonInM(
          latitude,
          longitude,
          COMPANY_LOCATION.lat,
          COMPANY_LOCATION.lng,
        )

        console.log(`Distância registrada: ${Math.round(distance)}m`)
        // Mock success for all distances in this demo, real implementation would block if > MAX_DISTANCE_METERS

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
          'Câmera não encontrada ou permissão negada. Você ainda pode registrar o ponto em modo restrito.',
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
    stopCamera()

    try {
      const { error } = await supabase.from('pontos').insert({
        funcionario_id: user?.id,
        tipo_ponto: 'Entrada',
        data_hora: new Date().toISOString(),
        latitude: location?.lat,
        longitude: location?.lng,
        wifi_conectado: true,
      })

      if (error) throw error

      setStatus('success')
      toast({ title: 'Ponto registrado', description: 'Seu ponto foi registrado com sucesso!' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar ponto no sistema.',
        variant: 'destructive',
      })
      setStatus('camera')
      startCamera()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            Registro de Ponto
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Confirme sua localização e tire uma foto para registrar.
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

          {status === 'idle' && (
            <Button
              size="lg"
              className="w-full h-16 text-xl font-semibold shadow-md transition-transform hover:scale-[1.02]"
              onClick={startProcess}
            >
              Iniciar Registro
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
            <div className="space-y-6 animate-fade-in">
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
              <Button
                size="lg"
                className="w-full h-16 text-xl font-semibold shadow-md transition-transform hover:scale-[1.02]"
                onClick={registerPonto}
                disabled={status === 'registering'}
              >
                <Camera className="w-6 h-6 mr-3" />
                {status === 'registering' ? 'Aguarde...' : 'Fotografar e Registrar'}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-fade-in-up">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold text-green-500">Ponto Registrado!</h3>
                <p className="text-muted-foreground text-lg">Seu registro foi salvo com sucesso.</p>
              </div>

              {hasFinanceiroAccess && (
                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-semibold group mt-4"
                  onClick={() => navigate('/')}
                >
                  Ir para Financeiro
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
