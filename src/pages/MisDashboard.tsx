import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const BADGE_PUBLICACION: Record<string, { label: string; bg: string; color: string }> = {
  activa:    { label: 'Activa',    bg: '#F0FFF4', color: '#2D6A4F' },
  alquilada: { label: 'Alquilada', bg: '#EBF8FF', color: '#2B6CB0' },
  inactiva:  { label: 'Inactiva',  bg: '#F7FAFC', color: '#718096' },
}

type ModalConfirm = {
  tipo: 'baja' | 'eliminar'
  propiedad: Propiedad
}

export default function MisDashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [propiedades, setPropiedades]   = useState<Propiedad[]>([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [modal, setModal]               = useState<ModalConfirm | null>(null)
  const [procesando, setProcesando]     = useState(false)
  const [msgOk, setMsgOk]              = useState<string | null>(null)

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

    if (propsErr) {
      setError(propsErr.message)
    } else {
      setPropiedades((props as Propiedad[]) ?? [])
    }
    setInquilinosActivos(inquCount ?? 0)
    setCargando(false)
  }

  const totalProps     = propiedades.length
  const disponibles    = propiedades.filter(p => (p.estado_publicacion ?? 'activa') === 'activa' && p.estado === 'disponible').length
  const alquiladas     = propiedades.filter(p => p.estado_publicacion === 'alquilada' || p.estado === 'arrendado').length
  const inactivas      = propiedades.filter(p => p.estado_publicacion === 'inactiva').length

  const handleDarDeBaja = async (prop: Propiedad) => {
    setProcesando(true)
    const { error: err } = await supabase
      .from('propiedades')
      .update({ estado_publicacion: 'inactiva' })
      .eq('id', prop.id)

    setProcesando(false)
    setModal(null)
    if (err) {
      setError(err.message)
    } else {
      setMsgOk(`"${prop.titulo}" fue dada de baja correctamente.`)
      await cargarDatos()
      setTimeout(() => setMsgOk(null), 4000)
    }
  }

  const handleEliminar = async (prop: Propiedad) => {
    setProcesando(true)
    const { error: err } = await supabase
      .from('propiedades')
      .delete()
      .eq('id', prop.id)

    setProcesando(false)
    setModal(null)
    if (err) {
      setError(err.message)
    } else {
      setMsgOk(`"${prop.titulo}" fue eliminada permanentemente.`)
      await cargarDatos()
      setTimeout(() => setMsgOk(null), 4000)
    }
  }

  const confirmar = () => {
    if (!modal) return
    if (modal.tipo === 'baja') handleDarDeBaja(modal.propiedad)
    else handleEliminar(modal.propiedad)
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
        <div className="grid grid-cols-2 gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total propiedades', valor: totalProps,        color: '#1B3A5C', bg: 'white' },
            { label: 'Disponibles',       valor: disponibles,       color: '#2D6A4F', bg: '#F0FFF4' },
            { label: 'Alquiladas',        valor: alquiladas,        color: '#2B6CB0', bg: '#EBF8FF' },
            { label: 'Inquilinos activos',valor: inquilinosActivos, color: '#7B341E', bg: '#FFFAF0' },
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
            <Link
              to="/propiedades/nueva"
              className="inline-block px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: '#52B788' }}
            >
              Publicar propiedad
            </Link>
          </div>
        )}

        {/* CARDS */}
        {!cargando && propiedades.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold" style={{ color: '#1B3A5C' }}>
                Tus propiedades ({propiedades.length})
              </h2>
              <Link
                to="/propiedades/nueva"
                className="text-sm font-bold px-5 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#52B788' }}
              >
                + Nueva propiedad
              </Link>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {propiedades.map(prop => {
                const pub = prop.estado_publicacion ?? 'activa'
                const badge = BADGE_PUBLICACION[pub] ?? BADGE_PUBLICACION['activa']
                const foto = prop.fotos?.[0]

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                    style={{ border: '1px solid #E2E8F0' }}
                  >
                    {/* Foto */}
                    <div style={{ height: '180px', backgroundColor: '#CBD5E0', position: 'relative', overflow: 'hidden' }}>
                      {foto ? (
                        <img
                          src={foto}
                          alt={prop.titulo}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096', fontSize: '13px' }}>
                          Sin foto
                        </div>
                      )}
                      {/* Badge publicación */}
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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/propiedades/${prop.id}`)}
                          style={{
                            flex: '1', padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: '#EBF8FF', color: '#2B6CB0', border: 'none', cursor: 'pointer',
                          }}
                        >
                          Ver detalle
                        </button>

                        <button
                          onClick={() => navigate(`/propiedades/${prop.id}/editar`)}
                          style={{
                            flex: '1', padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: '#F0FFF4', color: '#2D6A4F', border: 'none', cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>

                        {pub !== 'inactiva' ? (
                          <button
                            onClick={() => setModal({ tipo: 'baja', propiedad: prop })}
                            style={{
                              flex: '1', padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                              backgroundColor: '#FFFBEB', color: '#92400E', border: 'none', cursor: 'pointer',
                            }}
                          >
                            Dar de baja
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ tipo: 'eliminar', propiedad: prop })}
                            style={{
                              flex: '1', padding: '8px 0', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                              backgroundColor: '#FFF5F5', color: '#c53030', border: 'none', cursor: 'pointer',
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {inactivas > 0 && (
              <p className="text-sm mt-6 text-center" style={{ color: '#999' }}>
                {inactivas} propiedad{inactivas !== 1 ? 'es' : ''} dada{inactivas !== 1 ? 's' : ''} de baja (no visible{inactivas !== 1 ? 's' : ''} en el listado público)
              </p>
            )}
          </>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {modal && (
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
            {modal.tipo === 'eliminar' ? (
              <>
                <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>
                  Eliminar propiedad
                </h3>
                <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
                  Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente:
                </p>
                <p style={{ color: '#1B3A5C', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
                  "{modal.propiedad.titulo}"
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>📤</div>
                <h3 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>
                  Dar de baja la propiedad
                </h3>
                <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
                  La propiedad ya no será visible en el listado público:
                </p>
                <p style={{ color: '#1B3A5C', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
                  "{modal.propiedad.titulo}"
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setModal(null)}
                disabled={procesando}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  backgroundColor: 'white', color: '#555', border: '1px solid #CBD5E0', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={procesando}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  backgroundColor: modal.tipo === 'eliminar' ? '#c53030' : '#DD6B20',
                  color: 'white', border: 'none', cursor: procesando ? 'not-allowed' : 'pointer',
                  opacity: procesando ? 0.7 : 1,
                }}
              >
                {procesando ? 'Procesando...' : modal.tipo === 'eliminar' ? 'Eliminar definitivamente' : 'Dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
