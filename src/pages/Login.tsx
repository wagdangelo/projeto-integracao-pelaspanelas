import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { WalletCards, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstAccessModalOpen, setIsFirstAccessModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isCreatingPassword, setIsCreatingPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Se não houver senha, assumimos tentativa de primeiro acesso
    if (!password) {
      if (!email) {
        toast({ title: 'Atenção', description: 'Informe seu e-mail.', variant: 'destructive' })
        return
      }
      setIsFirstAccessModalOpen(true)
      return
    }

    setIsLoading(true)

    const { error } = await signIn(email, password)

    setIsLoading(false)
    if (error) {
      toast({
        title: 'Erro no login',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      })
      setTimeout(() => {
        navigate('/ponto')
      }, 0)
    }
  }

  const handleFirstAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Informe o e-mail no formulário principal.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }

    const isValid =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword)
    if (!isValid) {
      toast({
        title: 'Erro de Validação',
        description:
          'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingPassword(true)
    try {
      const { data, error } = await supabase.functions.invoke('setFirstPassword', {
        body: { email, password: newPassword },
      })

      if (error || data?.error)
        throw new Error(error?.message || data?.error || 'Erro ao criar senha')

      toast({ title: 'Sucesso', description: 'Senha criada com sucesso. Entrando...' })
      setIsFirstAccessModalOpen(false)

      const { error: signInError } = await signIn(email, newPassword)
      if (signInError) throw signInError

      setTimeout(() => {
        navigate('/ponto')
      }, 0)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setIsCreatingPassword(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/95 p-4 bg-[url('https://img.usecurling.com/p/1920/1080?q=abstract%20finance&color=black')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10 border-white/10 shadow-2xl bg-card/60 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <WalletCards className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Pelas Panelas ERP</CardTitle>
          <CardDescription>Gerencie suas finanças com segurança.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label
                htmlFor="keepLoggedIn"
                className="text-sm font-medium leading-none text-white/80 cursor-pointer"
              >
                Manter logado por 8 horas
              </Label>
            </div>
          </CardContent>
          <CardFooter className="pb-8 pt-4 flex-col gap-4">
            <Button type="submit" className="w-full text-md h-11" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-white/70 hover:text-white"
              onClick={() => {
                if (!email) {
                  toast({
                    title: 'Atenção',
                    description: 'Preencha seu e-mail acima primeiro.',
                    variant: 'destructive',
                  })
                  return
                }
                setIsFirstAccessModalOpen(true)
              }}
            >
              Primeiro acesso? Crie sua senha
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={isFirstAccessModalOpen} onOpenChange={setIsFirstAccessModalOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Primeiro Acesso - Criar Senha</DialogTitle>
            <DialogDescription>
              Defina uma senha segura para a conta <strong>{email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFirstAccess} className="space-y-4 py-4">
            <div className="space-y-2 relative">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10 bg-background/50 border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10 bg-background/50 border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma
                minúscula, um número e um caractere especial.
              </p>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFirstAccessModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingPassword}>
                {isCreatingPassword ? 'Criando...' : 'Criar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
