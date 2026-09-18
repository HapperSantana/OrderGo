import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Traduce los mensajes de error de Supabase a un lenguaje más claro para el usuario final.
function traducirError(mensaje: string): string {
  const mensajesConocidos: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta registrada con este correo.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
  }
  return mensajesConocidos[mensaje] ?? mensaje
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Recupera la sesión activa (si el usuario ya había iniciado sesión antes).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    // Se suscribe a cambios de sesión (login, logout, refresco de token) en tiempo real.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? traducirError(error.message) : null }
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email, password })
        return { error: error ? traducirError(error.message) : null }
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [session, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook de conveniencia para consumir el contexto de autenticación.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
  }
  return context
}
