import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const { registro, usuario } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tipo, setTipo] = useState<'Propietario' | 'Inquilino'>('Inquilino')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  if (usuario) {
    navigate('/propiedades', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCargando(true)
    const err = await registro(nombre.trim(), email, password, tipo)
    setCargando(false)

    if (err) {
      setError(traducirError(err))
      return
    }

    setExito(true)
  }

  if (exito) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ backgroundColor: '#1B3A5C', padding: '16px 40px' }}>
          <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
            Rentalo<span style={{ color: '#52B788' }}>Latam</span>
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 58px)', padding: '40px 16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#1B3A5C', fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
              ¡Cuenta creada!
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Revisá tu correo <strong>{email}</strong> para confirmar tu cuenta y luego podés iniciar sesión.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                backgroundColor: '#52B788',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '16px 40px' }}>
        <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </Link>
      </div>

      {/* Contenido */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 58px)', padding: '40px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
              🏠
            </div>
            <h1 style={{ color: '#1B3A5C', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Crear cuenta
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Unite a RentaloLatam gratis
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Nombre */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej: María García"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Email */}
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
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Tipo */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                ¿Cómo vas a usar RentaloLatam?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['Inquilino', 'Propietario'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '10px',
                      border: `2px solid ${tipo === t ? '#52B788' : '#E2E8F0'}`,
                      backgroundColor: tipo === t ? '#F0FFF4' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>
                      {t === 'Inquilino' ? '🔍' : '🏠'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: tipo === t ? '#2D6A4F' : '#333' }}>
                      {t}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {t === 'Inquilino' ? 'Busco propiedad' : 'Tengo propiedades'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '12px 14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: cargando ? '#A0AEC0' : '#52B788',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: cargando ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#666' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 'bold', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo.'
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('invalid email')) return 'El correo ingresado no es válido.'
  if (msg.includes('Too many requests')) return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}
