import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowRightLeft,
  Activity,
  PieChart,
  LogOut,
  Bell,
  Search,
  Plus,
  Building2,
  BookOpen,
  Users,
  Truck,
  Receipt,
  HandCoins,
  UserCog,
  Store,
  Clock,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TransactionModal } from './TransactionModal'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const role = user?.role || 'Cozinha'
  const allNavItems = [
    {
      icon: Clock,
      label: 'Ponto',
      path: '/ponto',
      showFor: ['Admin', 'Adm', 'Gerente', 'Cozinha', 'RH'],
    },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', showFor: ['Admin', 'Adm', 'Gerente'] },
    {
      icon: ArrowRightLeft,
      label: 'Transações',
      path: '/transacoes',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: Receipt,
      label: 'Contas a Pagar',
      path: '/contas-a-pagar',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: HandCoins,
      label: 'Contas a Receber',
      path: '/contas-a-receber',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: Store,
      label: 'Faturamento',
      path: '/faturamento',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    { icon: Truck, label: 'Pedidos', path: '/pedidos', showFor: ['Admin', 'Adm', 'Gerente'] },
    { icon: Activity, label: 'Fluxo de caixa', path: '/fluxo-caixa', showFor: ['Admin', 'Adm'] },
    {
      icon: Users,
      label: 'Favorecidos',
      path: '/favorecidos',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: Building2,
      label: 'Bancos',
      path: '/admin/bancos',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: PieChart,
      label: 'Relatórios',
      path: '/relatorios',
      showFor: ['Admin', 'Adm', 'Gerente'],
    },
    {
      icon: BookOpen,
      label: 'Plano de Contas',
      path: '/admin/plano-contas',
      showFor: ['Admin', 'Adm'],
    },
    {
      icon: UserCog,
      label: 'RH / Funcionários',
      path: '/admin/usuarios',
      showFor: ['Admin', 'Adm', 'Gerente', 'RH'],
    },
  ].filter((item) => {
    return item.showFor.includes(role)
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
        <Sidebar className="border-r border-sidebar-border bg-sidebar" variant="sidebar">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-primary-foreground"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m2 7 4.5-4.5 4.5 4.5" />
                  <path d="m2 17 4.5 4.5 4.5-4.5" />
                  <path d="M6.5 2.5v19" />
                  <path d="m13 17 4.5 4.5 4.5-4.5" />
                  <path d="m13 7 4.5-4.5 4.5 4.5" />
                  <path d="M17.5 2.5v19" />
                </svg>
              </div>
              Pelas Panelas
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 pt-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavItems.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path))
                    return (
                      <SidebarMenuItem key={item.path} className="mb-1">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`h-11 rounded-xl transition-all duration-300 ease-in-out ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1'}`}
                        >
                          <Link to={item.path} className="flex items-center gap-3 px-3 text-base">
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 mb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="h-11 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/40 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="hidden flex-col md:flex animate-fade-in-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">
                    Olá, {user?.name?.split(' ')[0] || 'Usuário'}
                  </h1>
                  {user?.role && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Bem-vindo ao seu painel financeiro</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 hidden sm:flex"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
              </Button>

              <Avatar className="h-9 w-9 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage
                  src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=12"
                  alt="User"
                />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>

              <div className="h-6 w-px bg-border hidden sm:block mx-1" />

              {/* Mobile primary action */}
              {['Admin', 'Adm', 'Gerente'].includes(role) && (
                <Button
                  onClick={() => setIsTransactionModalOpen(true)}
                  size="icon"
                  className="sm:hidden rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <TransactionModal open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen} />
    </SidebarProvider>
  )
}
