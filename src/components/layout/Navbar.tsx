import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar__marca">
        <span className="navbar__sello" aria-hidden="true">
          OG
        </span>
        <span className="navbar__nombre">OrderGo</span>
      </div>

      <nav className="navbar__enlaces">
        <NavLink
          to="/clientes"
          className={({ isActive }) => 'navbar__enlace' + (isActive ? ' navbar__enlace--activo' : '')}
        >
          Clientes
        </NavLink>
      </nav>

      <div className="navbar__usuario">
        <span className="navbar__correo">{user?.email}</span>
        <button type="button" className="boton boton--fantasma" onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
