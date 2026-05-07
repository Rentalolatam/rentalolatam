import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const IconMicrosoft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
)

export default function Login() {
  const { login, usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/propiedades'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoSocial, setCargandoSocial] = useState<'google' | 'microsoft' | null>(null)

  if (usuario) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const err = await login(email, password)
    setCargando(false)
    if (err) {
      setError(traducirError(err))
      return
    }
    navigate(from, { replace: true })
  }

  const handleGoogle = async () => {
    setCargandoSocial('google')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleMicrosoft = async () => {
    setCargandoSocial('microsoft')
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const bloqueado = cargando || cargandoSocial !== null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#1B3A5C', padding: '16px 40px' }}>
        <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 58px)', padding: '40px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
              🔑
            </div>
            <h1 style={{ color: '#1B3A5C', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Iniciar sesión
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Bienvenido de vuelta a RentaloLatam
            </p>
          </div>

          {/* Botones sociales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={bloqueado}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '11px 16px', borderRadius: '8px',
                border: '1.5px solid #CBD5E0', backgroundColor: 'white',
                fontSize: '14px', fontWeight: '600', color: '#333',
                cursor: bloqueado ? 'not-allowed' : 'pointer',
                opacity: bloqueado ? 0.7 : 1,
              }}
            >
              {cargandoSocial === 'google' ? <span style={{ fontSize: '13px', color: '#666' }}>Redirigiendo...</span> : <><IconGoogle /> Continuar con Google</>}
            </button>

            <button
              type="button"
              onClick={handleMicrosoft}
              disabled={bloqueado}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '11px 16px', borderRadius: '8px',
                border: '1.5px solid #CBD5E0', backgroundColor: 'white',
                fontSize: '14px', fontWeight: '600', color: '#333',
                cursor: bloqueado ? 'not-allowed' : 'pointer',
                opacity: bloqueado ? 0.7 : 1,
              }}
            >
              {cargandoSocial === 'microsoft' ? <span style={{ fontSize: '13px', color: '#666' }}>Redirigiendo...</span> : <><IconMicrosoft /> Continuar con Microsoft</>}
            </button>
          </div>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap' }}>o continúa con tu email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                disabled={bloqueado}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Tu contraseña"
                disabled={bloqueado}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '12px 14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={bloqueado}
              style={{
                backgroundColor: bloqueado ? '#A0AEC0' : '#52B788',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '12px', fontSize: '15px', fontWeight: 'bold',
                cursor: bloqueado ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#666' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" style={{ color: '#2D6A4F', fontWeight: 'bold', textDecoration: 'none' }}>
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu correo antes de ingresar.'
  if (msg.includes('Too many requests')) return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}
