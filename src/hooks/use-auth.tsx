import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: any
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (!session) {
        setUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN') {
        setLoading(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      setLoading(true)
      supabase
        .from('funcionarios')
        .select('*')
        .eq('email', session.user.email)
        .single()
        .then(({ data }) => {
          if (data) {
            setUser({ ...session.user, ...data, role: data.role || 'Cozinha' })
          } else {
            setUser({ ...session.user, role: 'Cozinha' })
          }
          setLoading(false)
        })
        .catch(() => {
          setUser({ ...session.user, role: 'Cozinha' })
          setLoading(false)
        })
    }
  }, [session?.user?.id, session?.user?.email])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
