import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type NavbarProps = {
  extraLinks?: { label: string; href: string }[]
}

export default function Navbar({ extraLinks }: NavbarProps) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const [tienePropiedades, setTienePropiedades] = useState(false)
  const [tieneArriendo, setTieneArriendo]       = useState(false)
  const [tieneContratos, setTieneContratos]     = useState(false)

  useEffect(() => {
    if (!usuario) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTienePropiedades(false)
      setTieneArriendo(false)
      setTieneContratos(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }

    const verificar = async () => {
      const [{ count: propCount }, { count: solCount }, { count: contCount }] = await Promise.all([
        supabase
          .from('propiedades')
          .select('id', { count: 'exact', head: true })
          .eq('publicado_por', usuario.id),
        supabase
          .from('solicitudes_arriendo')
          .select('id', { count: 'exact', head: true })
          .eq('inquilino_id', usuario.id)
          .in('estado', ['aprobada', 'documentos_pendientes', 'documentos_enviados', 'activa']),
        supabase
          .from('contratos')
          .select('id', { count: 'exact', head: true })
          .eq('propietario_id', usuario.id),
      ])
      setTienePropiedades((propCount ?? 0) > 0)
      setTieneArriendo((solCount ?? 0) > 0)
      setTieneContratos((contCount ?? 0) > 0)
    }

    verificar()
  }, [usuario])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

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

        <Link to="/nosotros" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
          Nosotros
        </Link>

        {tienePropiedades && (
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Mi dashboard
          </Link>
        )}

        {tienePropiedades && (
          <Link to="/inquilinos" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Inquilinos
          </Link>
        )}

        {tieneArriendo && (
          <Link to="/mi-arriendo" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Mi arriendo
          </Link>
        )}

        {tieneContratos && (
          <Link to="/contratos" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Contratos
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
            <Link
              to="/perfil"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              {usuario.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nombre}
                  referrerPolicy="no-referrer"
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }}
                />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  👤
                </div>
              )}
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                {usuario.nombre}
              </span>
            </Link>
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
