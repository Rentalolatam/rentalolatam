import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type PerfilUsuario = {
  id: string
  email: string
  nombre: string
  tipo: 'Propietario' | 'Inquilino'
  foto: string | null
}

type AuthContextType = {
  usuario: PerfilUsuario | null
  cargando: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  registro: (nombre: string, email: string, password: string, tipo: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapUser(user: User): PerfilUsuario {
  return {
    id: user.id,
    email: user.email ?? '',
    nombre: (user.user_metadata?.nombre as string | undefined)
      ?? (user.user_metadata?.full_name as string | undefined)
      ?? user.email
      ?? '',
    tipo: (user.user_metadata?.tipo as 'Propietario' | 'Inquilino' | undefined) ?? 'Inquilino',
    foto: (user.user_metadata?.avatar_url as string | undefined)
      ?? (user.user_metadata?.picture as string | undefined)
      ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ? mapUser(session.user) : null)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ? mapUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    return null
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const registro = async (
    nombre: string,
    email: string,
    password: string,
    tipo: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, tipo } },
    })
    if (error) return error.message
    return null
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, registro }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
