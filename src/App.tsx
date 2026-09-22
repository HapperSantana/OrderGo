import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PrivateRoute } from './components/layout/PrivateRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ClientesPage } from './pages/ClientesPage'
import { PedidosPage } from './pages/PedidosPage'
import { ProductosPage } from './pages/ProductosPage'

function RaizDeLaApp() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="pantalla-carga" role="status" aria-live="polite">
        <span className="pantalla-carga__spinner" aria-hidden="true" />
        Cargando…
      </div>
    )
  }

  return <Navigate to={user ? '/pedidos' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RaizDeLaApp />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <ClientesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/pedidos"
        element={
          <PrivateRoute>
            <PedidosPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/productos"
        element={
          <PrivateRoute>
            <ProductosPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}