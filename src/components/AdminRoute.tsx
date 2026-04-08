import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export const AdminRoute = ({
  children,
  allowedRoles = ['Admin'],
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-8 flex justify-center text-muted-foreground">Carregando...</div>
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/transacoes" replace />
  }

  return <>{children}</>
}
