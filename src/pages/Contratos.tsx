import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type Contrato } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

type ContratoEnriquecido = Contrato & {
  solicitudes_arriendo: { inquilino_nombre: string | null } | null
  propiedades: { titulo: string; zona: string } | null
}

const ESTADO_CFG: Record<Contrato['estado'], { label: string; bg: string; color: string }> = {
  enviado:             { label: 'Enviado a firmar',        bg: '#EBF8FF', color: '#2B6CB0' },
  firmado_inquilino:   { label: 'Firmado por inquilino',   bg: '#FFFBEB', color: '#92400E' },
  firmado_propietario: { label: 'Firmado por propietario', bg: '#FFFBEB', color: '#92400E' },
  completado:          { label: 'Completado',              bg: '#F0FFF4', color: '#276749' },
  cancelado:           { label: 'Cancelado',               bg: '#FFF5F5', color: '#c53030' },
}

export default function Contratos() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [contratos, setContratos] = useState<ContratoEnriquecido[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('contratos')
        .select('*, solicitudes_arriendo(inquilino_nombre), propiedades(titulo, zona)')
        .eq('propietario_id', usuario.id)
        .order('created_at', { ascending: false })
      if (sbError) setError(sbError.message)
      else setContratos((data as ContratoEnriquecido[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [usuario])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>Contratos</h1>
          <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0 }}>Contratos de arrendamiento enviados para firma digital</p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Cargando contratos...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '14px', fontSize: '13px' }}>
            Error: {error}
          </div>
        )}

        {!cargando && !error && contratos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📄</div>
            <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Aún no hay contratos
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Cuando apruebes un inquilino y generes su contrato, aparecerá aquí.
            </p>
            <button
              onClick={() => navigate('/inquilinos')}
              style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}
            >
              Ir a inquilinos
            </button>
          </div>
        )}

        {!cargando && contratos.length > 0 && (
          <>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
              {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
            </p>

            {/* Tabla */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr', gap: '0', backgroundColor: '#F7FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Inquilino', 'Propiedad', 'Período', 'Estado', 'Generado'].map((h) => (
                  <div key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </div>
                ))}
              </div>

              {contratos.map((c, i) => {
                const cfg = ESTADO_CFG[c.estado]
                const esPar = i % 2 === 0
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/inquilinos/${c.solicitud_id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr',
                      gap: '0',
                      backgroundColor: esPar ? 'white' : '#FAFAFA',
                      borderBottom: '1px solid #F0F0F0',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#EBF8FF20' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = esPar ? 'white' : '#FAFAFA' }}
                  >
                    <div style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#1B3A5C' }}>
                      {c.solicitudes_arriendo?.inquilino_nombre ?? '—'}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', color: '#333' }}>{c.propiedades?.titulo ?? '—'}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{c.propiedades?.zona ?? ''}</div>
                    </div>
                    <div style={{ padding: '14px 16px', fontSize: '13px', color: '#555' }}>
                      {c.fecha_inicio
                        ? `${new Date(c.fecha_inicio + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : '—'}
                      <br />
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        {c.fecha_fin
                          ? `al ${new Date(c.fecha_fin + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}`
                          : ''}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color, pointerEvents: 'none' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', fontSize: '12px', color: '#999' }}>
                      {new Date(c.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
