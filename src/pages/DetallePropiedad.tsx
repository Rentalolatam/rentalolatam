import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Propiedad, type SolicitudArriendo, type Perfil } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import MapaUbicacion from '../components/MapaUbicacion'

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#F0FFF4', color: '#2D6A4F' },
  arrendado: { label: 'Arrendado', bg: '#FFF5F5', color: '#c53030' },
  'en mantenimiento': { label: 'En mantenimiento', bg: '#FFFBEB', color: '#92400E' },
}

export default function DetallePropiedad() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fotoActiva, setFotoActiva] = useState(0)

  const [solicitudExistente, setSolicitudExistente] = useState<SolicitudArriendo | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null)
  const [perfilUsuario, setPerfilUsuario] = useState<Perfil | null>(null)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('propiedades')
        .select('*')
        .eq('id', id)
        .single()
      if (sbError) setError(sbError.message)
      else setPropiedad(data as Propiedad)
      setCargando(false)
    }
    cargar()
  }, [id])

  useEffect(() => {
    if (!id || !usuario) return
    const cargarSolicitud = async () => {
      const { data } = await supabase
        .from('solicitudes_arriendo')
        .select('*')
        .eq('propiedad_id', id)
        .eq('inquilino_id', usuario.id)
        .maybeSingle()
      if (data) setSolicitudExistente(data as SolicitudArriendo)
    }
    cargarSolicitud()
  }, [id, usuario])

  // Load user profile for auto-fill and gate check
  useEffect(() => {
    if (!usuario) return
    supabase.from('profiles').select('*').eq('id', usuario.id).maybeSingle().then(({ data }) => {
      if (data) setPerfilUsuario(data as Perfil)
    })
  }, [usuario])

  const abrirModalSolicitar = () => {
    if (!perfilUsuario?.perfil_completo) {
      navigate(`/perfil?next=/propiedades/${id}`)
      return
    }
    // Auto-fill message pre-populate is done at modal open time
    setMensajeSolicitud('')
    setModalAbierto(true)
  }

  const handleSolicitar = async () => {
    if (!usuario || !propiedad) return
    setErrorSolicitud(null)
    setEnviandoSolicitud(true)

    const { data, error: sbError } = await supabase
      .from('solicitudes_arriendo')
      .insert({
        propiedad_id:    propiedad.id,
        inquilino_id:    usuario.id,
        propietario_id:  propiedad.publicado_por,
        mensaje:         mensajeSolicitud.trim() || null,
        inquilino_nombre: perfilUsuario?.nombre_completo ?? usuario.nombre,
      })
      .select()
      .single()

    if (sbError) {
      setErrorSolicitud(`No se pudo enviar la solicitud: ${sbError.message}`)
      setEnviandoSolicitud(false)
      return
    }

    const sol = data as SolicitudArriendo

    // Create conversation automatically
    await supabase.from('conversaciones').upsert({
      solicitud_id:   sol.id,
      propiedad_id:   propiedad.id,
      propietario_id: propiedad.publicado_por,
      inquilino_id:   usuario.id,
    }, { onConflict: 'solicitud_id', ignoreDuplicates: true })

    setSolicitudExistente(sol)
    setModalAbierto(false)
    setMensajeSolicitud('')
    setEnviandoSolicitud(false)
  }

  const fotos = propiedad?.fotos?.filter(Boolean) ?? []
  const badge = propiedad ? (ESTADO_BADGE[propiedad.estado] ?? ESTADO_BADGE['disponible']) : null

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', border: '4px solid #52B788',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto',
            }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Cargando propiedad...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error || !propiedad) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🏚</div>
          <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold' }}>Propiedad no encontrada</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>{error ?? 'No existe una propiedad con ese ID.'}</p>
          <button
            onClick={() => navigate('/propiedades')}
            style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}
          >
            Volver a propiedades
          </button>
        </div>
      </div>
    )
  }

  const p = propiedad
  const esPropietario = usuario?.id === p.publicado_por

  const SOLICITUD_ESTADO_LABEL: Record<SolicitudArriendo['estado'], string> = {
    pendiente: 'Solicitud pendiente de revisión',
    aprobada: 'Solicitud aprobada',
    rechazada: 'Solicitud rechazada',
    documentos_pendientes: 'Documentos en revisión',
    documentos_enviados: 'Documentos enviados',
    activa: 'Arriendo activo',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '14px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          <button onClick={() => navigate('/propiedades')} style={{ background: 'none', border: 'none', color: '#CBD5E0', cursor: 'pointer', padding: 0, fontSize: '13px' }}>
            Propiedades
          </button>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: 'white' }}>{p.zona}</span>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: '#52B788' }}>{p.titulo}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* GALERÍA */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '100%', height: '480px', borderRadius: '16px', overflow: 'hidden',
            backgroundColor: '#CBD5E0', marginBottom: '12px', position: 'relative',
          }}>
            {fotos.length > 0 ? (
              <img
                src={fotos[fotoActiva]}
                alt={`${p.titulo} - foto ${fotoActiva + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#999' }}>
                <span style={{ fontSize: '48px' }}>📷</span>
                <span style={{ fontSize: '14px' }}>Sin fotos disponibles</span>
              </div>
            )}

            {fotos.length > 1 && (
              <div style={{
                position: 'absolute', bottom: '16px', right: '16px',
                backgroundColor: 'rgba(0,0,0,0.55)', color: 'white',
                borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 'bold',
              }}>
                {fotoActiva + 1} / {fotos.length}
              </div>
            )}

            {fotos.length > 1 && (
              <>
                <button
                  onClick={() => setFotoActiva((i) => (i - 1 + fotos.length) % fotos.length)}
                  style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setFotoActiva((i) => (i + 1) % fotos.length)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {fotos.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {fotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setFotoActiva(i)}
                  style={{
                    flexShrink: 0, width: '88px', height: '64px', borderRadius: '8px', overflow: 'hidden',
                    border: `2px solid ${i === fotoActiva ? '#52B788' : 'transparent'}`,
                    padding: 0, cursor: 'pointer', backgroundColor: '#CBD5E0',
                    opacity: i === fotoActiva ? 1 : 0.65, transition: 'all 0.15s',
                  }}
                >
                  <img src={url} alt={`miniatura ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAPA DE UBICACIÓN APROXIMADA */}
        {p.mostrar_mapa && p.latitud != null && p.longitud != null && (
          <div style={{ marginBottom: '32px', backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px' }}>📍 Ubicación</h2>
            <MapaUbicacion lat={p.latitud} lng={p.longitud} />
            <p style={{ color: '#999', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
              Ubicación aproximada. La dirección exacta se comparte al confirmar el arriendo.
            </p>
          </div>
        )}

        {/* CONTENIDO: info + panel lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>

          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Encabezado */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#1B3A5C', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '6px' }}>
                  {p.tipo}
                </span>
                {badge && (
                  <span style={{ backgroundColor: badge.bg, color: badge.color, fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '6px' }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <h1 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>{p.titulo}</h1>
              <p style={{ color: '#52B788', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>📍 {p.zona}, {p.pais}</p>
            </div>

            {/* Características */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h2 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Características</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { icon: '🛏', label: 'Habitaciones', val: `${p.habitaciones}` },
                  { icon: '🚿', label: 'Baños', val: `${p.banos}` },
                  { icon: '🚗', label: 'Parqueos', val: p.tiene_parqueo ? `${p.cantidad_parqueos ?? 1}` : 'No' },
                  { icon: '🛋', label: 'Amueblado', val: p.amueblado ? 'Sí' : 'No' },
                  { icon: '📐', label: 'Metraje', val: p.metraje_sin_parqueo ? `${p.metraje_sin_parqueo} m²` : '—' },
                  { icon: '📐', label: 'Con parqueo', val: p.metraje_con_parqueo ? `${p.metraje_con_parqueo} m²` : '—' },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B3A5C' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            {p.descripcion && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <h2 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Descripción</h2>
                <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{p.descripcion}</p>
              </div>
            )}

            {/* Sobre el edificio / condominio */}
            {p.tiene_info_edificio && ((p.amenidades_edificio?.length ?? 0) > 0 || (p.fotos_edificio?.length ?? 0) > 0) && (() => {
              const labelEdificio = p.tipo === 'Apartamento' ? 'Sobre el edificio' : 'Sobre el condominio/residencial'
              const amenidades = p.amenidades_edificio ?? []
              const fotosEdif = p.fotos_edificio ?? []
              return (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    🏢 {labelEdificio}
                  </h2>

                  {amenidades.length > 0 && (
                    <div style={{ marginBottom: fotosEdif.length > 0 ? '20px' : 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '10px' }}>Amenidades</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {amenidades.map(a => (
                          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                            <span style={{ color: '#2D6A4F', fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                            <span style={{ color: '#2D6A4F', fontSize: '13px' }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fotosEdif.length > 0 && (
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '10px' }}>
                        📷 Fotos del {p.tipo === 'Apartamento' ? 'edificio' : 'condominio/residencial'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {fotosEdif.map((url, i) => (
                          <div key={i} style={{ flexShrink: 0, width: '160px', height: '110px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#CBD5E0', border: '2px solid #E2E8F0' }}>
                            <img
                              src={url}
                              alt={`${labelEdificio} ${i + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div>
              <button
                onClick={() => navigate('/propiedades')}
                style={{ background: 'none', border: 'none', color: '#2D6A4F', fontSize: '14px', cursor: 'pointer', padding: 0, fontWeight: '500' }}
              >
                ← Volver a propiedades
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA — Panel de precio y acción */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              {/* Precio */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#1B3A5C', fontSize: '30px', fontWeight: 'bold', lineHeight: 1 }}>
                  Q{p.precio_quetzales.toLocaleString('es-GT')}
                  <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666' }}>/mes</span>
                </div>
                <div style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>
                  ≈ ${p.precio_dolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/mes
                </div>
              </div>

              {/* Etiquetas de precio */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {p.incluye_iva && (
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>
                    IVA incluido
                  </span>
                )}
                {p.incluye_mantenimiento && (
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>
                    Mantenimiento incluido
                  </span>
                )}
                {!p.incluye_iva && !p.incluye_mantenimiento && (
                  <span style={{ fontSize: '11px', color: '#999' }}>Precio base sin IVA ni mantenimiento</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Botón solicitar — visible para no-propietarios (logueados o no) */}
                {!esPropietario && (
                  !usuario ? (
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        width: '100%', backgroundColor: '#52B788', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Solicitar arrendar esta propiedad
                    </button>
                  ) : solicitudExistente ? (
                    <>
                      <div style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>✅</div>
                        <p style={{ color: '#2D6A4F', fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px' }}>
                          {SOLICITUD_ESTADO_LABEL[solicitudExistente.estado]}
                        </p>
                        <p style={{ color: '#555', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                          El propietario revisará tu solicitud pronto.
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/conversacion/${solicitudExistente.id}`)}
                        style={{
                          width: '100%', backgroundColor: 'transparent', color: '#1B3A5C',
                          border: '1.5px solid #1B3A5C', borderRadius: '10px', padding: '11px',
                          fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                        }}
                      >
                        💬 Mensaje al propietario
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={abrirModalSolicitar}
                      style={{
                        width: '100%', backgroundColor: '#52B788', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Solicitar arrendar esta propiedad
                    </button>
                  )
                )}

                {/* Propietario viendo su propia propiedad */}
                {esPropietario && (
                  <div style={{ backgroundColor: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#2B6CB0', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                      Esta es tu propiedad publicada
                    </p>
                  </div>
                )}

                {/* Publicar tu propiedad (solo si no es propietario de esta prop) */}
                {!esPropietario && (
                  <button
                    onClick={() => navigate('/propiedades/nueva')}
                    style={{
                      width: '100%', backgroundColor: 'transparent', color: '#1B3A5C',
                      border: '1.5px solid #1B3A5C', borderRadius: '10px', padding: '12px',
                      fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                    }}
                  >
                    ¿Tenés una propiedad? Publicala
                  </button>
                )}
              </div>
            </div>

            {/* Datos rápidos */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Tipo', val: p.tipo },
                  { label: 'País', val: p.pais },
                  { label: 'Zona', val: p.zona },
                  { label: 'Estado', val: badge?.label ?? p.estado },
                  { label: 'Publicado', val: new Date(p.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#999' }}>{label}</span>
                    <span style={{ color: '#333', fontWeight: '500' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL de solicitud */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px' }}>
              Solicitar arriendo
            </h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>
              {p.titulo} · {p.zona}
            </p>

            {/* Auto-filled contact info */}
            {perfilUsuario && (
              <div style={{ backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 4px', fontWeight: '600' }}>Tu información de contacto</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>👤 {perfilUsuario.nombre_completo ?? usuario?.nombre}</span>
                  <span style={{ fontSize: '13px', color: '#333' }}>✉️ {usuario?.email}</span>
                  {perfilUsuario.telefono && <span style={{ fontSize: '13px', color: '#333' }}>📞 {perfilUsuario.telefono}</span>}
                </div>
                <a href="/perfil" style={{ fontSize: '11px', color: '#2D6A4F', textDecoration: 'none' }}>Editar perfil →</a>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>
                Mensaje al propietario (opcional)
              </label>
              <textarea
                value={mensajeSolicitud}
                onChange={(e) => setMensajeSolicitud(e.target.value)}
                placeholder="Presentate y contá un poco sobre vos, tu situación, cuándo querés mudarte, etc."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #CBD5E0', fontSize: '14px',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'Arial, sans-serif',
                }}
              />
            </div>

            {errorSolicitud && (
              <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                {errorSolicitud}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setModalAbierto(false); setMensajeSolicitud(''); setErrorSolicitud(null) }}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #CBD5E0',
                  color: '#666', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitar}
                disabled={enviandoSolicitud}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  backgroundColor: enviandoSolicitud ? '#A0AEC0' : '#52B788',
                  color: 'white', fontSize: '14px', fontWeight: 'bold',
                  cursor: enviandoSolicitud ? 'not-allowed' : 'pointer',
                }}
              >
                {enviandoSolicitud ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
