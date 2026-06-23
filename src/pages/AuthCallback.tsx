import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect as soon as the session is ready
  useEffect(() => {
    if (usuario) {
      navigate('/propiedades', { replace: true })
    }
  }, [usuario, navigate])

  // Check URL for provider error params, timeout fallback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const providerError = params.get('error_description') ?? hashParams.get('error_description') ?? params.get('error')

    if (providerError) {
      setErrorMsg(decodeURIComponent(providerError))
      return
    }

    const timer = setTimeout(() => {
      if (!usuario) {
        setErrorMsg('No se pudo completar el inicio de sesión. Intentá de nuevo.')
      }
    }, 10_000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            Error al iniciar sesión
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            {errorMsg}
          </p>
          <Link
            to="/login"
            style={{ display: 'inline-block', backgroundColor: '#52B788', color: 'white', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#555', fontSize: '15px' }}>Completando inicio de sesión...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
