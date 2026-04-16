import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Ponto from './pages/Ponto'
import Transactions from './pages/Transactions'
import Billing from './pages/Billing'
import Layout from './components/Layout'
import PersonalDashboard from './pages/PersonalDashboard'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import BanksAdmin from './pages/admin/Banks'
import ImportOfx from './pages/admin/ImportOfx'
import ChartOfAccounts from './pages/admin/ChartOfAccounts'
import StoresAdmin from './pages/admin/Stores'
import CashFlow from './pages/CashFlow'
import Clients from './pages/admin/Clients'
import AccountsPayable from './pages/AccountsPayable'
import AccountsReceivable from './pages/AccountsReceivable'
import UsersAdmin from './pages/admin/Users'
import Orders from './pages/Orders'
import { ThemeProvider } from './contexts/ThemeContext'

const DashboardGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasClockedInToday } = useAuth()
  const alertsChecked = useRef(false)
  const location = useLocation()

  useEffect(() => {
    if (
      !loading &&
      user &&
      ['admin', 'gerente'].includes(user.role?.toLowerCase() || '') &&
      !alertsChecked.current
    ) {
      alertsChecked.current = true
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      supabase
        .from('pontos')
        .select('*, funcionarios(nome)')
        .eq('status_validacao', 'fora_tolerancia')
        .gte('data_hora', today.toISOString())
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.forEach((ponto: any) => {
              toast({
                title: 'Alerta de Ponto',
                description: `${ponto.funcionarios?.nome || 'Funcionário'} registrou ${ponto.tipo_ponto} fora do horário esperado (${ponto.horario}).`,
                variant: 'destructive',
                duration: 10000,
              })
            })
          }
        })
    }
  }, [loading, user])

  if (loading) return null

  const role = user?.role?.toLowerCase() || ''
  const requiresClockIn = ['cozinha', 'administrativo', 'adm'].includes(role)

  if (requiresClockIn && !hasClockedInToday && location.pathname !== '/ponto') {
    return <Navigate to="/ponto" replace />
  }

  if (['cozinha', 'administrativo', 'adm'].includes(role)) {
    return <Navigate to="/meu-painel" replace />
  }

  return <div className="contents">{children}</div>
}

const RoleGuard = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { user, loading, hasClockedInToday } = useAuth()
  const location = useLocation()
  if (loading) return null

  const role = user?.role?.toLowerCase() || ''
  const requiresClockIn = ['cozinha', 'administrativo', 'adm'].includes(role)

  if (requiresClockIn && !hasClockedInToday && location.pathname !== '/ponto') {
    return <Navigate to="/ponto" replace />
  }

  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === role)
  if (!isAllowed) {
    if (role === 'cozinha') return <Navigate to="/meu-painel" replace />
    if (['administrativo', 'adm'].includes(role)) return <Navigate to="/meu-painel" replace />
    if (role === 'gerente') return <Navigate to="/" replace />
    return <Navigate to="/" replace />
  }

  return <div className="contents">{children}</div>
}

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vast-theme">
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/ponto"
                element={
                  <RoleGuard allowedRoles={['admin', 'cozinha', 'administrativo', 'adm']}>
                    <Ponto />
                  </RoleGuard>
                }
              />
              <Route
                path="/"
                element={
                  <DashboardGuard>
                    <Index />
                  </DashboardGuard>
                }
              />
              <Route
                path="/meu-painel"
                element={
                  <RoleGuard allowedRoles={['cozinha', 'administrativo', 'adm']}>
                    <PersonalDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/transacoes"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Transactions />
                  </RoleGuard>
                }
              />
              <Route
                path="/faturamento"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Billing />
                  </RoleGuard>
                }
              />
              <Route
                path="/pedidos"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Orders />
                  </RoleGuard>
                }
              />
              <Route
                path="/contas-a-pagar"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <AccountsPayable />
                  </RoleGuard>
                }
              />
              <Route
                path="/contas-a-receber"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AccountsReceivable />
                  </RoleGuard>
                }
              />
              <Route
                path="/fluxo-caixa"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <CashFlow />
                  </RoleGuard>
                }
              />
              <Route
                path="/favorecidos"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente']}>
                    <Clients />
                  </RoleGuard>
                }
              />
              <Route
                path="/fornecedores"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <Index />
                  </RoleGuard>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <Index />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/bancos"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <BanksAdmin />
                  </RoleGuard>
                }
              />
              <Route
                path="/importacao"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <ImportOfx />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/lojas"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente']}>
                    <StoresAdmin />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/plano-contas"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente']}>
                    <ChartOfAccounts />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <RoleGuard allowedRoles={['admin', 'administrativo', 'adm', 'rh']}>
                    <UsersAdmin />
                  </RoleGuard>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

export default App
