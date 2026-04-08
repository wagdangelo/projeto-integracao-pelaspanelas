import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('Erro 404: Usuário tentou acessar rota inexistente:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-transparent">
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-indigo-500/20 tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold tracking-tight text-white">Página não encontrada</h2>
          <p className="text-muted-foreground max-w-[500px] mx-auto">
            Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido
            movida ou não existe mais.
          </p>
        </div>
        <Button asChild className="rounded-xl px-8" variant="default">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
