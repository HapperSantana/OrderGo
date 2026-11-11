import { useState } from 'react'
import { useEnvioUnico } from '../../hooks/useEnvioUnico'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogIn } from 'lucide-react'

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const enviarUnaVez = useEnvioUnico()

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    // Un segundo envío mientras el primero sigue en curso se ignora (ver useEnvioUnico).
    await enviarUnaVez(async () => {
      setError(null)
      setIsSubmitting(true)

      const { error: errorInicioSesion } = await signIn(email.trim(), password)

      setIsSubmitting(false)

      if (errorInicioSesion) {
        setError(errorInicioSesion)
        return
      }

      navigate('/pedidos', { replace: true })
    })
  }

  return (
    <form className="formulario-auth" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <h1 className="formulario-auth__titulo">Inicia sesión</h1>
      <p className="formulario-auth__subtitulo">Accede a tu panel de pedidos.</p>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      <label className="campo">
        <span className="campo__etiqueta">Correo electrónico</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="tunegocio@correo.com"
        />
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Contraseña</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          placeholder="••••••••"
        />
      </label>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        <LogIn size={18} aria-hidden="true" focusable="false" />
        {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
      </button>

      <p className="formulario-auth__pie">
        ¿Aún no tienes una cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </form>
  )
}
