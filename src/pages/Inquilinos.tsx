import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Inquilino } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const ESTADO_CONFIG: Record<Inquilino['estado'], { label: string; bg: string; color: string }> = {
  basico:                { label: 'Básico',                bg: '#F7FAFC', color: '#4A5568' },
  documentos_pendientes: { label: 'Docs. pendientes',      bg: '#FFFBEB', color: '#92400E' },
  listo:                 { label: 'Listo',                 bg: '#F0FFF4', color: '#2D6A4F' },
}

export default function Inquilinos() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([])
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('inquilinos')
        .select('*')
        .eq('propietario_id', usuario.id)
        .order('created_at', { ascending: false })
      if (sbError) setError(sbError.message)
      else setInquilinos((data as Inquilino[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [usuario])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>Mis inquilinos</h1>
            <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0 }}>Gestioná el perfil y documentos de tus inquilinos</p>
          </div>
          <Link
            to="/inquilinos/nuevo"
            style={{ backgroundColor: '#52B788', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
          >
            + Agregar inquilino
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Loading */}
        {cargando && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Cargando inquilinos...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '14px', fontSize: '13px' }}>
            Error al cargar inquilinos: {error}
          </div>
        )}

        {/* Empty */}
        {!cargando && !error && inquilinos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>👥</div>
            <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Aún no tenés inquilinos registrados
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Agregá a tus inquilinos para gestionar sus documentos y contratos
            </p>
            <Link
              to="/inquilinos/nuevo"
              style={{ backgroundColor: '#52B788', color: 'white', padding: '12px 32px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
            >
              Agregar primer inquilino
            </Link>
          </div>
        )}

        {/* Grid */}
        {!cargando && inquilinos.length > 0 && (
          <>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
              {inquilinos.length} inquilino{inquilinos.length !== 1 ? 's' : ''} registrado{inquilinos.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {inquilinos.map((inq) => (
                <InquilinoCard key={inq.id} inquilino={inq} onClick={() => navigate(`/inquilinos/${inq.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InquilinoCard({ inquilino: inq, onClick }: { inquilino: Inquilino; onClick: () => void }) {
  const cfg = ESTADO_CONFIG[inq.estado]
  const iniciales = inq.nombre_completo
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
        transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', gap: '16px', alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {/* Avatar */}
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>
        {iniciales}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
          <h3 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {inq.nombre_completo}
          </h3>
          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0, pointerEvents: 'none' }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {inq.email}
        </p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#999' }}>
          {inq.telefono && <span>📞 {inq.telefono}</span>}
          {inq.tipo_documento && <span>🪪 {inq.tipo_documento}</span>}
        </div>
      </div>
    </div>
  )
}
