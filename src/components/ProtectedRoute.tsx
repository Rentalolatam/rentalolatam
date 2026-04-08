import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', border: '4px solid #52B788',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto',
          }} />
          <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Verificando sesión...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
