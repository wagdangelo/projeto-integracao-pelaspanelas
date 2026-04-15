import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  if (loading) return null

  const role = user?.role?.toLowerCase() || ''
  const requiresClockIn = ['cozinha', 'administrativo', 'adm'].includes(role)

  if (requiresClockIn && !hasClockedInToday) {
    return <Navigate to="/ponto" replace />
  }

  if (role === 'cozinha') {
    return <Navigate to="/ponto" replace />
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
  if (loading) return null

  const role = user?.role?.toLowerCase() || ''
  const requiresClockIn = ['cozinha', 'administrativo', 'adm'].includes(role)

  if (requiresClockIn && !hasClockedInToday) {
    return <Navigate to="/ponto" replace />
  }

  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === role)
  if (!isAllowed) {
    if (role === 'cozinha') return <Navigate to="/ponto" replace />
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
              <Route path="/ponto" element={<Ponto />} />
              <Route
                path="/"
                element={
                  <DashboardGuard>
                    <Index />
                  </DashboardGuard>
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
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <AccountsReceivable />
                  </RoleGuard>
                }
              />
              <Route
                path="/fluxo-caixa"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <CashFlow />
                  </RoleGuard>
                }
              />
              <Route
                path="/favorecidos"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Clients />
                  </RoleGuard>
                }
              />
              <Route
                path="/fornecedores"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Index />
                  </RoleGuard>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <Index />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/bancos"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <BanksAdmin />
                  </RoleGuard>
                }
              />
              <Route
                path="/importacao"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <ImportOfx />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/lojas"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <StoresAdmin />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/plano-contas"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm']}>
                    <ChartOfAccounts />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <RoleGuard allowedRoles={['admin', 'gerente', 'administrativo', 'adm', 'rh']}>
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
