import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: any
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  hasClockedInToday: boolean
  checkClockIn: (userId?: string) => Promise<void>
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
  const [hasClockedInToday, setHasClockedInToday] = useState(false)

  const checkClockIn = useCallback(
    async (userId?: string) => {
      const targetUserId = userId || session?.user?.id
      if (!targetUserId) return

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('pontos')
        .select('id')
        .eq('funcionario_id', targetUserId)
        .eq('tipo_ponto', 'Entrada')
        .gte('data_hora', todayStart.toISOString())
        .limit(1)

      setHasClockedInToday(!!(data && data.length > 0))
    },
    [session?.user?.id],
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (!session) {
        setUser(null)
        setHasClockedInToday(false)
        setLoading(false)
      } else if (event === 'SIGNED_IN') {
        setLoading(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        setUser(null)
        setHasClockedInToday(false)
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
        .then(async ({ data }) => {
          let currentUser
          if (data) {
            currentUser = { ...session.user, ...data, role: data.role || 'Cozinha' }
          } else {
            currentUser = { ...session.user, role: 'Cozinha' }
          }
          setUser(currentUser)

          const role = currentUser.role?.toLowerCase() || ''
          if (['cozinha', 'administrativo', 'adm'].includes(role)) {
            await checkClockIn(currentUser.id)
          } else {
            setHasClockedInToday(true)
          }

          setLoading(false)
        })
        .catch(() => {
          const currentUser = { ...session.user, role: 'Cozinha' }
          setUser(currentUser)
          setHasClockedInToday(false)
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
    setHasClockedInToday(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, signIn, signOut, loading, hasClockedInToday, checkClockIn }}
    >
      {children}
    </AuthContext.Provider>
  )
}
