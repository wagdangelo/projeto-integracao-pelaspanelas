import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  ShoppingCart,
  Users,
  Building,
  Building2,
  Landmark,
  Upload,
  LogOut,
  Clock,
  ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'gerente'] },
  {
    title: 'Meu Painel',
    path: '/meu-painel',
    icon: ListTodo,
    roles: ['cozinha', 'administrativo', 'adm'],
  },
  {
    title: 'Ponto',
    path: '/ponto',
    icon: Clock,
    roles: ['admin', 'gerente', 'cozinha', 'administrativo', 'adm'],
  },
  {
    title: 'Transações',
    path: '/transacoes',
    icon: Receipt,
    roles: ['admin', 'gerente', 'administrativo', 'adm'],
  },
  {
    title: 'Contas a Pagar',
    path: '/contas-a-pagar',
    icon: FileText,
    roles: ['admin', 'gerente', 'administrativo', 'adm'],
  },
  {
    title: 'Contas a Receber',
    path: '/contas-a-receber',
    icon: FileText,
    roles: ['admin', 'gerente'],
  },
  {
    title: 'Faturamento',
    path: '/faturamento',
    icon: Landmark,
    roles: ['admin', 'gerente', 'administrativo', 'adm'],
  },
  {
    title: 'Pedidos',
    path: '/pedidos',
    icon: ShoppingCart,
    roles: ['admin', 'gerente', 'administrativo', 'adm'],
  },
  { title: 'Fluxo de Caixa', path: '/fluxo-caixa', icon: Landmark, roles: ['admin', 'gerente'] },
  { title: 'Clientes/Favorecidos', path: '/favorecidos', icon: Users, roles: ['admin', 'gerente'] },
  { title: 'Bancos', path: '/admin/bancos', icon: Building2, roles: ['admin', 'gerente'] },
  { title: 'Lojas', path: '/admin/lojas', icon: Building, roles: ['admin', 'gerente'] },
  {
    title: 'Plano de Contas',
    path: '/admin/plano-contas',
    icon: FileText,
    roles: ['admin', 'gerente'],
  },
  { title: 'Usuários', path: '/admin/usuarios', icon: Users, roles: ['admin', 'gerente', 'rh'] },
  { title: 'Importar OFX', path: '/importacao', icon: Upload, roles: ['admin', 'gerente'] },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role = user?.role?.toLowerCase() || ''

  const filteredMenu = menuItems.filter((item) => {
    if (role === 'cozinha') {
      return ['/meu-painel', '/ponto'].includes(item.path)
    }
    if (role === 'administrativo' || role === 'adm') {
      return [
        '/meu-painel',
        '/ponto',
        '/transacoes',
        '/contas-a-pagar',
        '/faturamento',
        '/pedidos',
      ].includes(item.path)
    }
    return item.roles.includes(role)
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold tracking-tight">Vast</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenu.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                        <Link to={item.path}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              className="w-full justify-start text-sidebar-foreground"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </Sidebar>
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background text-foreground">
          <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6 shrink-0">
            <SidebarTrigger />
            <div className="w-full flex-1">
              <h1 className="font-semibold text-lg">
                {filteredMenu.find((m) => m.path === location.pathname)?.title || 'Vast Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user?.name || user?.email}</span>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
