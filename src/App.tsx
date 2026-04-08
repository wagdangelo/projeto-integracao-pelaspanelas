import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Transactions from './pages/Transactions'
import Billing from './pages/Billing'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import BanksAdmin from './pages/admin/Banks'
import ImportOfx from './pages/admin/ImportOfx'
import ChartOfAccounts from './pages/admin/ChartOfAccounts'
import CashFlow from './pages/CashFlow'
import Clients from './pages/admin/Clients'
import AccountsPayable from './pages/AccountsPayable'
import AccountsReceivable from './pages/AccountsReceivable'
import UsersAdmin from './pages/admin/Users'
import { ThemeProvider } from './contexts/ThemeContext'

const DashboardGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'Gerente') return <Navigate to="/transacoes" replace />
  return <>{children}</>
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
                path="/"
                element={
                  <DashboardGuard>
                    <Index />
                  </DashboardGuard>
                }
              />
              <Route path="/transacoes" element={<Transactions />} />
              <Route path="/faturamento" element={<Billing />} />
              <Route path="/contas-a-pagar" element={<AccountsPayable />} />
              <Route path="/contas-a-receber" element={<AccountsReceivable />} />
              <Route
                path="/fluxo-caixa"
                element={
                  <AdminRoute>
                    <CashFlow />
                  </AdminRoute>
                }
              />
              <Route
                path="/favorecidos"
                element={
                  <AdminRoute allowedRoles={['Admin', 'Gerente']}>
                    <Clients />
                  </AdminRoute>
                }
              />
              <Route path="/fornecedores" element={<Index />} />
              <Route path="/relatorios" element={<Index />} />
              <Route
                path="/admin/bancos"
                element={
                  <AdminRoute allowedRoles={['Admin', 'Gerente']}>
                    <BanksAdmin />
                  </AdminRoute>
                }
              />
              <Route
                path="/importacao"
                element={
                  <AdminRoute allowedRoles={['Admin', 'Gerente']}>
                    <ImportOfx />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/plano-contas"
                element={
                  <AdminRoute>
                    <ChartOfAccounts />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <AdminRoute>
                    <UsersAdmin />
                  </AdminRoute>
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
