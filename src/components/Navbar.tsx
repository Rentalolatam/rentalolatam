import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TIPO_BADGE: Record<string, { bg: string; color: string }> = {
  Propietario: { bg: '#EBF8FF', color: '#2B6CB0' },
  Inquilino: { bg: '#F0FFF4', color: '#2D6A4F' },
}

type NavbarProps = {
  /** Links adicionales que aparecen entre "Propiedades" y los botones de auth */
  extraLinks?: { label: string; href: string }[]
}

export default function Navbar({ extraLinks }: NavbarProps) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const badge = usuario ? TIPO_BADGE[usuario.tipo] ?? TIPO_BADGE['Inquilino'] : null

  return (
    <nav style={{
      backgroundColor: '#1B3A5C',
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
        Rentalo<span style={{ color: '#52B788' }}>Latam</span>
      </Link>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/propiedades" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
          Propiedades
        </Link>

        {usuario?.tipo === 'Propietario' && (
          <Link to="/inquilinos" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Inquilinos
          </Link>
        )}

        {extraLinks?.map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}
          >
            {link.label}
          </a>
        ))}

        {usuario ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                {usuario.nombre}
              </span>
              {badge && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                }}>
                  {usuario.tipo}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                color: '#CBD5E0',
                border: '1px solid #CBD5E0',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}
            >
              Iniciar sesión
            </Link>
            <Link
              to="/propiedades/nueva"
              style={{
                backgroundColor: '#52B788',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Publicar propiedad
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
