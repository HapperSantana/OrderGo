import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setMensajeExito(null)

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const { error: errorRegistro } = await signUp(email.trim(), password)
    setIsSubmitting(false)

    if (errorRegistro) {
      setError(errorRegistro)
      return
    }

    // Si el proyecto de Supabase tiene activa la confirmación por correo,
    // el usuario debe confirmar su cuenta antes de poder iniciar sesión.
    setMensajeExito('Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')
    setTimeout(() => navigate('/login', { replace: true }), 2500)
  }

  return (
    <form className="formulario-auth" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <h2 className="formulario-auth__titulo">Crea tu cuenta</h2>
      <p className="formulario-auth__subtitulo">Registra el acceso para administrar tu negocio.</p>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {mensajeExito && (
        <p className="mensaje-exito" role="status">
          {mensajeExito}
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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Confirmar contraseña</span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          placeholder="Repite la contraseña"
        />
      </label>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="formulario-auth__pie">
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  )
}
