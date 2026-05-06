import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type SolicitudArriendo } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

type SolicitudConPropiedad = SolicitudArriendo & {
  propiedades: { titulo: string; zona: string; tipo: string } | null
}

const ESTADO_ACTIVO_CFG: Record<string, { label: string; bg: string; color: string }> = {
  aprobada:             { label: 'Aprobada',              bg: '#EBF8FF', color: '#2B6CB0' },
  documentos_pendientes:{ label: 'Docs. en revisión',     bg: '#FFFBEB', color: '#92400E' },
  documentos_enviados:  { label: 'Docs. enviados',        bg: '#F0FFF4', color: '#2D6A4F' },
  activa:               { label: 'Activo',                bg: '#F0FFF4', color: '#276749' },
}

const ESTADOS_ACTIVOS = ['aprobada', 'documentos_pendientes', 'documentos_enviados', 'activa']

export default function Inquilinos() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<SolicitudConPropiedad[]>([])
  const [cargando, setCargando]        = useState(true)
  const [error, setError]              = useState<string | null>(null)
  const [accionando, setAccionando]    = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('solicitudes_arriendo')
        .select('*, propiedades(titulo, zona, tipo)')
        .eq('propietario_id', usuario.id)
        .neq('estado', 'rechazada')
        .order('created_at', { ascending: false })
      if (sbError) setError(sbError.message)
      else setSolicitudes((data as SolicitudConPropiedad[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [usuario])

  const cambiarEstado = async (id: string, estado: SolicitudArriendo['estado']) => {
    setAccionando(id)
    await supabase.from('solicitudes_arriendo').update({ estado }).eq('id', id)
    setSolicitudes((prev) =>
      estado === 'rechazada'
        ? prev.filter((s) => s.id !== id)
        : prev.map((s) => (s.id === id ? { ...s, estado } : s))
    )
    setAccionando(null)
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente')
  const activos    = solicitudes.filter((s) => ESTADOS_ACTIVOS.includes(s.estado))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>Mis inquilinos</h1>
          <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0 }}>Gestioná solicitudes y perfiles de tus inquilinos</p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Cargando...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '14px', fontSize: '13px' }}>
            Error: {error}
          </div>
        )}

        {!cargando && !error && solicitudes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📬</div>
            <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Aún no tenés solicitudes de arriendo
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Cuando alguien solicite arrendar una de tus propiedades, aparecerá aquí.
            </p>
            <Link
              to="/inquilinos/nuevo"
              style={{ color: '#2D6A4F', fontSize: '14px', textDecoration: 'underline' }}
            >
              Agregar inquilino manualmente
            </Link>
          </div>
        )}

        {/* ── SECCIÓN 1: Solicitudes pendientes ── */}
        {!cargando && pendientes.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                Solicitudes de arriendo
              </h2>
              <span style={{ backgroundColor: '#FED7AA', color: '#92400E', fontSize: '12px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '999px' }}>
                {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendientes.map((sol) => (
                <SolicitudPendienteCard
                  key={sol.id}
                  solicitud={sol}
                  accionando={accionando}
                  onAprobar={() => cambiarEstado(sol.id, 'aprobada')}
                  onRechazar={() => cambiarEstado(sol.id, 'rechazada')}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SECCIÓN 2: Inquilinos activos ── */}
        {!cargando && activos.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px' }}>
              Inquilinos activos
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {activos.map((sol) => (
                <InquilinoActivoCard
                  key={sol.id}
                  solicitud={sol}
                  onClick={() => navigate(`/inquilinos/${sol.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Link manual (siempre visible si hay data) */}
        {!cargando && solicitudes.length > 0 && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px', textAlign: 'center' }}>
            <Link
              to="/inquilinos/nuevo"
              style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}
            >
              ➕ Agregar inquilino manualmente
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-componentes ── */

function SolicitudPendienteCard({
  solicitud: sol,
  accionando,
  onAprobar,
  onRechazar,
}: {
  solicitud: SolicitudConPropiedad
  accionando: string | null
  onAprobar: () => void
  onRechazar: () => void
}) {
  const ocupado = accionando === sol.id
  const iniciales = (sol.inquilino_nombre ?? 'IN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      border: '1.5px solid #FED7AA',
      display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#744210', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', flexShrink: 0 }}>
        {iniciales}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ color: '#1B3A5C', fontWeight: 'bold', fontSize: '15px' }}>
            {sol.inquilino_nombre ?? 'Inquilino'}
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#FFFBEB', color: '#92400E', fontWeight: 'bold' }}>
            Pendiente
          </span>
        </div>
        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 4px' }}>
          {sol.propiedades?.titulo ?? '—'} · {sol.propiedades?.zona ?? ''}
        </p>
        {sol.mensaje && (
          <p style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', margin: '6px 0 0', lineHeight: '1.5', padding: '8px 12px', backgroundColor: '#FFFBEB', borderRadius: '6px' }}>
            "{sol.mensaje}"
          </p>
        )}
        <p style={{ color: '#999', fontSize: '11px', margin: '8px 0 0' }}>
          {new Date(sol.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'center' }}>
        <button
          onClick={onRechazar}
          disabled={ocupado}
          style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
            border: '1.5px solid #FEB2B2', backgroundColor: 'white',
            color: '#c53030', cursor: ocupado ? 'not-allowed' : 'pointer', opacity: ocupado ? 0.6 : 1,
          }}
        >
          Rechazar
        </button>
        <button
          onClick={onAprobar}
          disabled={ocupado}
          style={{
            padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
            border: 'none', backgroundColor: ocupado ? '#A0AEC0' : '#52B788',
            color: 'white', cursor: ocupado ? 'not-allowed' : 'pointer',
          }}
        >
          {ocupado ? '...' : 'Aprobar'}
        </button>
      </div>
    </div>
  )
}

function InquilinoActivoCard({
  solicitud: sol,
  onClick,
}: {
  solicitud: SolicitudConPropiedad
  onClick: () => void
}) {
  const cfg = ESTADO_ACTIVO_CFG[sol.estado] ?? ESTADO_ACTIVO_CFG['activa']
  const iniciales = (sol.inquilino_nombre ?? 'IN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex', gap: '14px', alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', flexShrink: 0 }}>
        {iniciales}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sol.inquilino_nombre ?? 'Inquilino'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0, pointerEvents: 'none' }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ color: '#666', fontSize: '13px', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sol.propiedades?.titulo ?? '—'}
        </p>
        <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0' }}>
          {sol.propiedades?.zona ?? ''}
        </p>
      </div>
    </div>
  )
}
