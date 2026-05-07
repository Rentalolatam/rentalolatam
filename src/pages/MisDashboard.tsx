import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const BADGE_PUBLICACION: Record<string, { label: string; bg: string; color: string }> = {
  activa:    { label: 'Activa',    bg: '#F0FFF4', color: '#2D6A4F' },
  alquilada: { label: 'Alquilada', bg: '#FFF3E0', color: '#C05621' },
  inactiva:  { label: 'Archivada', bg: '#F7FAFC', color: '#718096' },
}

type ModalTipo = 'alquilar' | 'archivar' | 'activar'

type ModalConfirm = {
  tipo: ModalTipo
  propiedad: Propiedad
}

const MODAL_CONFIG: Record<ModalTipo, {
  icono: string
  titulo: string
  descripcion: string
  btnLabel: string
  btnColor: string
}> = {
  alquilar: {
    icono: '🏠',
    titulo: 'Marcar como alquilada',
    descripcion: 'Esta propiedad se marcará como alquilada y dejará de aparecer en el marketplace.',
    btnLabel: 'Marcar como alquilada',
    btnColor: '#DD6B20',
  },
  archivar: {
    icono: '📦',
    titulo: 'Archivar propiedad',
    descripcion: 'Esta propiedad se archivará y dejará de aparecer en el marketplace y en tu dashboard activo.',
    btnLabel: 'Archivar',
    btnColor: '#718096',
  },
  activar: {
    icono: '✅',
    titulo: 'Volver a activar',
    descripcion: 'Esta propiedad volverá a aparecer en el marketplace como disponible.',
    btnLabel: 'Activar',
    btnColor: '#2D6A4F',
  },
}

export default function MisDashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [propiedades, setPropiedades]       = useState<Propiedad[]>([])
  const [cargando, setCargando]             = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [modal, setModal]                   = useState<ModalConfirm | null>(null)
  const [procesando, setProcesando]         = useState(false)
  const [msgOk, setMsgOk]                  = useState<string | null>(null)
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false)
  const [inquilinosActivos, setInquilinosActivos] = useState(0)

  useEffect(() => {
    if (!usuario) return
    cargarDatos()
  }, [usuario])

  const cargarDatos = async () => {
    if (!usuario) return
    setCargando(true)
    setError(null)

    const [{ data: props, error: propsErr }, { count: inquCount }] = await Promise.all([
      supabase
        .from('propiedades')
        .select('*')
        .eq('publicado_por', usuario.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('solicitudes_arriendo')
        .select('id', { count: 'exact', head: true })
        .eq('propietario_id', usuario.id)
        .eq('estado', 'activa'),
    ])

    if (propsErr) setError(propsErr.message)
    else setPropiedades((props as Propiedad[]) ?? [])

    setInquilinosActivos(inquCount ?? 0)
    setCargando(false)
  }

  const activas    = propiedades.filter(p => (p.estado_publicacion ?? 'activa') === 'activa')
  const alquiladas = propiedades.filter(p => p.estado_publicacion === 'alquilada')
  const archivadas = propiedades.filter(p => p.estado_publicacion === 'inactiva')

  const ejecutarAccion = async () => {
    if (!modal) return
    setProcesando(true)

    const nuevoEstado =
      modal.tipo === 'alquilar' ? 'alquilada' :
      modal.tipo === 'archivar' ? 'inactiva'  : 'activa'

    const { error: err } = await supabase
      .from('propiedades')
      .update({ estado_publicacion: nuevoEstado })
      .eq('id', modal.propiedad.id)

    setProcesando(false)
    setModal(null)

    if (err) {
      setError(err.message)
    } else {
      const msgs: Record<ModalTipo, string> = {
        alquilar: `"${modal.propiedad.titulo}" marcada como alquilada.`,
        archivar: `"${modal.propiedad.titulo}" archivada correctamente.`,
        activar:  `"${modal.propiedad.titulo}" activada y visible en el marketplace.`,
      }
      setMsgOk(msgs[modal.tipo])
      await cargarDatos()
      setTimeout(() => setMsgOk(null), 4000)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Mi dashboard</h1>
        <p style={{ color: '#CBD5E0', fontSize: '15px' }}>
          Administrá tus propiedades publicadas en RentaloLatam
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* STATS */}
        <div className="grid gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total propiedades',  valor: propiedades.length, color: '#1B3A5C', bg: 'white' },
            { label: 'Activas',            valor: activas.length,     color: '#2D6A4F', bg: '#F0FFF4' },
            { label: 'Alquiladas',         valor: alquiladas.length,  color: '#C05621', bg: '#FFF3E0' },
            { label: 'Inquilinos activos', valor: inquilinosActivos,  color: '#7B341E', bg: '#FFFAF0' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: s.bg, border: '1px solid #E2E8F0' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{cargando ? '—' : s.valor}</div>
              <div className="text-sm" style={{ color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="rounded-lg p-4 text-sm mb-6" style={{ backgroundColor: '#FFF5F5', color: '#c53030', border: '1px solid #FEB2B2' }}>
            {error}
          </div>
        )}
        {msgOk && (
          <div className="rounded-lg p-4 text-sm mb-6" style={{ backgroundColor: '#F0FFF4', color: '#2D6A4F', border: '1px solid #9AE6B4' }}>
            {msgOk}
          </div>
        )}

        {/* CARGANDO */}
        {cargando && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#52B788', borderTopColor: 'transparent' }} />
            <p className="mt-4 text-sm" style={{ color: '#666' }}>Cargando propiedades...</p>
          </div>
        )}

        {/* VACÍO */}
        {!cargando && propiedades.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1B3A5C' }}>Todavía no publicaste propiedades</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>Publicá tu primera propiedad y comenzá a recibir solicitudes</p>
            <Link to="/propiedades/nueva" className="inline-block px-8 py-3 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: '#52B788' }}>
              Publicar propiedad
            </Link>
          </div>
        )}

        {/* PROPIEDADES ACTIVAS + ALQUILADAS */}
        {!cargando && (activas.length > 0 || alquiladas.length > 0) && (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold" style={{ color: '#1B3A5C' }}>
                Tus propiedades ({activas.length + alquiladas.length})
              </h2>
              <Link to="/propiedades/nueva" className="text-sm font-bold px-5 py-2 rounded-lg text-white" style={{ backgroundColor: '#52B788' }}>
                + Nueva propiedad
              </Link>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {[...activas, ...alquiladas].map(prop => {
                const pub = prop.estado_publicacion ?? 'activa'
                const badge = BADGE_PUBLICACION[pub] ?? BADGE_PUBLICACION['activa']
                const foto = prop.fotos?.[0]
                const esAlquilada = pub === 'alquilada'

                return (
                  <div key={prop.id} className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                    {/* Foto */}
                    <div style={{ height: '180px', backgroundColor: '#CBD5E0', position: 'relative', overflow: 'hidden' }}>
                      {foto ? (
                        <img src={foto} alt={prop.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096', fontSize: '13px' }}>
                          Sin foto
                        </div>
                      )}
                      <span style={{
                        position: 'absolute', top: '10px', right: '10px',
                        fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
                        borderRadius: '999px', backgroundColor: badge.bg, color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '18px' }}>
                      <div style={{ color: '#52B788', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {prop.zona} · {prop.tipo}
                      </div>
                      <h3 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', lineHeight: '1.3' }}>
                        {prop.titulo}
                      </h3>
                      <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                        {prop.habitaciones} hab · {prop.banos} baños
                        {prop.tiene_parqueo ? ' · Parqueo' : ''}
                        {prop.amueblado ? ' · Amueblado' : ''}
                      </div>
                      <div style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                        Q{prop.precio_quetzales.toLocaleString()}/mes
                      </div>

                      {/* Acciones */}
                      {esAlquilada ? (
                        /* Propiedad alquilada: solo Ver detalle + Volver a activar */
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/propiedades/${prop.id}`)}
                            style={{ flex: 1, padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#EBF8FF', color: '#2B6CB0', border: 'none', cursor: 'pointer' }}
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => setModal({ tipo: 'activar', propiedad: prop })}
                            style={{ flex: 1, padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#F0FFF4', color: '#2D6A4F', border: 'none', cursor: 'pointer' }}
                          >
                            Volver a activar
                          </button>
                        </div>
                      ) : (
                        /* Propiedad activa: Ver detalle + Editar + Marcar alquilada + Archivar */
                        <>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <button
                              onClick={() => navigate(`/propiedades/${prop.id}`)}
                              style={{ flex: 1, padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#EBF8FF', color: '#2B6CB0', border: 'none', cursor: 'pointer' }}
                            >
                              Ver detalle
                            </button>
                            <button
                              onClick={() => navigate(`/propiedades/${prop.id}/editar`)}
                              style={{ flex: 1, padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#F0FFF4', color: '#2D6A4F', border: 'none', cursor: 'pointer' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setModal({ tipo: 'alquilar', propiedad: prop })}
                              style={{ flex: 1, padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#FFF3E0', color: '#C05621', border: 'none', cursor: 'pointer' }}
                            >
                              Marcar alquilada
                            </button>
                          </div>
                          <button
                            onClick={() => setModal({ tipo: 'archivar', propiedad: prop })}
                            style={{ width: '100%', padding: '6px 0', borderRadius: '7px', fontSize: '11px', fontWeight: '500', backgroundColor: 'transparent', color: '#A0AEC0', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                          >
                            Archivar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* SECCIÓN ARCHIVADAS (colapsable) */}
        {!cargando && archivadas.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <button
              onClick={() => setMostrarArchivadas(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ color: '#718096', fontSize: '14px', fontWeight: '600' }}>
                {mostrarArchivadas ? '▾' : '▸'} Archivadas ({archivadas.length})
              </span>
            </button>

            {mostrarArchivadas && (
              <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {archivadas.map(prop => {
                  const foto = prop.fotos?.[0]
                  return (
                    <div key={prop.id} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', opacity: 0.75 }}>
                      <div style={{ height: '120px', backgroundColor: '#E2E8F0', position: 'relative', overflow: 'hidden' }}>
                        {foto ? (
                          <img src={foto} alt={prop.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(60%)' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A0AEC0', fontSize: '12px' }}>Sin foto</div>
                        )}
                        <span style={{
                          position: 'absolute', top: '8px', right: '8px',
                          fontSize: '10px', fontWeight: 'bold', padding: '2px 8px',
                          borderRadius: '999px', backgroundColor: '#F7FAFC', color: '#718096',
                        }}>
                          Archivada
                        </span>
                      </div>
                      <div style={{ padding: '14px' }}>
                        <h3 style={{ color: '#718096', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>{prop.titulo}</h3>
                        <button
                          onClick={() => setModal({ tipo: 'activar', propiedad: prop })}
                          style={{ width: '100%', padding: '7px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#F0FFF4', color: '#2D6A4F', border: '1px solid #9AE6B4', cursor: 'pointer' }}
                        >
                          Restaurar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {modal && (() => {
        const cfg = MODAL_CONFIG[modal.tipo]
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', padding: '32px',
              maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>{cfg.icono}</div>
              <h3 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>
                {cfg.titulo}
              </h3>
              <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
                {cfg.descripcion}
              </p>
              <p style={{ color: '#1B3A5C', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
                "{modal.propiedad.titulo}"
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setModal(null)}
                  disabled={procesando}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: 'white', color: '#555', border: '1px solid #CBD5E0', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarAccion}
                  disabled={procesando}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: cfg.btnColor, color: 'white', border: 'none', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1 }}
                >
                  {procesando ? 'Procesando...' : cfg.btnLabel}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
