import { LogOut, Mail } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoSombrero } from './LogoSombrero'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar__marca">
        <LogoSombrero className="navbar__logo" tamano={40} />
        <span className="navbar__nombre">OrderGo</span>
      </div>

      <nav className="navbar__enlaces">
        <NavLink
          to="/panel"
          className={({ isActive }) => 'navbar__enlace' + (isActive ? ' navbar__enlace--activo' : '')}
        >
          Panel
        </NavLink>
        <NavLink
          to="/pedidos"
          className={({ isActive }) => 'navbar__enlace' + (isActive ? ' navbar__enlace--activo' : '')}
        >
          Pedidos
        </NavLink>
        <NavLink
          to="/clientes"
          className={({ isActive }) => 'navbar__enlace' + (isActive ? ' navbar__enlace--activo' : '')}
        >
          Clientes
        </NavLink>
        <NavLink
          to="/productos"
          className={({ isActive }) => 'navbar__enlace' + (isActive ? ' navbar__enlace--activo' : '')}
        >
          Productos
        </NavLink>
      </nav>

      <div className="navbar__usuario">
        <span className="navbar__correo">
          <Mail size={16} aria-hidden="true" focusable="false" />
          {user?.email}
        </span>
        <button type="button" className="boton boton--fantasma" onClick={() => void signOut()}>
          <LogOut size={16} aria-hidden="true" focusable="false" />
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
