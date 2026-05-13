import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type SolicitudArriendo, type DocumentoInquilino, type TipoDocumento } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const BUCKET = 'documentos-inquilinos'

type DocConfig = {
  tipo: TipoDocumento
  label: string
  descripcion: string
  requerido: boolean
  icon: string
}

const DOCS_CONFIG: DocConfig[] = [
  { tipo: 'dpi_frente',              label: 'DPI — Frente',             descripcion: 'Foto frontal del DPI',                  requerido: true,  icon: '🪪' },
  { tipo: 'dpi_reverso',             label: 'DPI — Reverso',            descripcion: 'Foto trasera del DPI',                  requerido: true,  icon: '🪪' },
  { tipo: 'recibo_servicio',         label: 'Recibo de servicio',       descripcion: 'Agua, luz o teléfono reciente',         requerido: true,  icon: '💡' },
  { tipo: 'antecedentes_policiales', label: 'Antecedentes policiales',  descripcion: 'Emitido por la PNC',                    requerido: false, icon: '👮' },
  { tipo: 'antecedentes_penales',    label: 'Antecedentes penales',     descripcion: 'Emitido por el MP / INACIF',            requerido: false, icon: '⚖️' },
  { tipo: 'prueba_ingresos',         label: 'Prueba de ingresos',       descripcion: 'Carta laboral, estado de cuenta, etc.', requerido: false, icon: '💼' },
]

type SolicitudConPropiedad = SolicitudArriendo & {
  propiedades: {
    titulo: string
    zona: string
    tipo: string
    precio_quetzales: number
    precio_dolares: number
    fotos: string[]
    habitaciones: number
    banos: number
  } | null
}

const ESTADO_INFO: Record<SolicitudArriendo['estado'], { label: string; descripcion: string; color: string; bg: string; icon: string }> = {
  pendiente:             { label: 'En revisión',              descripcion: 'El propietario está revisando tu solicitud.',                       color: '#92400E', bg: '#FFFBEB', icon: '⏳' },
  aprobada:              { label: 'Aprobada — Subí tus docs', descripcion: 'El propietario aprobó tu solicitud. Por favor subí tus documentos.', color: '#2B6CB0', bg: '#EBF8FF', icon: '📋' },
  rechazada:             { label: 'No aprobada',              descripcion: 'El propietario no aprobó tu solicitud.',                            color: '#c53030', bg: '#FFF5F5', icon: '❌' },
  documentos_pendientes: { label: 'Documentos en revisión',   descripcion: 'El propietario está revisando tus documentos.',                     color: '#92400E', bg: '#FFFBEB', icon: '📄' },
  documentos_enviados:   { label: 'Documentos completos',     descripcion: 'Todos los documentos requeridos fueron enviados. ¡Casi listo!',     color: '#2D6A4F', bg: '#F0FFF4', icon: '✅' },
  activa:                { label: 'Arriendo activo',          descripcion: 'Tu arriendo está confirmado. ¡Bienvenido a tu nuevo hogar!',        color: '#276749', bg: '#F0FFF4', icon: '🏡' },
}

export default function MiArriendo() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()

  const [solicitudes, setSolicitudes]  = useState<SolicitudConPropiedad[]>([])
  const [documentos, setDocumentos]    = useState<DocumentoInquilino[]>([])
  const [cargando, setCargando]        = useState(true)
  const [error, setError]              = useState<string | null>(null)
  const [solicitudActual, setSolicitudActual] = useState<SolicitudConPropiedad | null>(null)

  const [subiendo, setSubiendo]        = useState<TipoDocumento | null>(null)
  const [errorDoc, setErrorDoc]        = useState<string | null>(null)
  const inputsRef                      = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('solicitudes_arriendo')
        .select('*, propiedades(titulo, zona, tipo, precio_quetzales, precio_dolares, fotos, habitaciones, banos)')
        .eq('inquilino_id', usuario.id)
        .order('created_at', { ascending: false })

      if (sbError) { setError(sbError.message); setCargando(false); return }

      const soles = (data as SolicitudConPropiedad[]) ?? []
      setSolicitudes(soles)

      // Usar la solicitud más reciente no rechazada, o la primera
      const principal = soles.find((s) => s.estado !== 'rechazada') ?? soles[0] ?? null
      setSolicitudActual(principal)

      if (principal) {
        const { data: docData } = await supabase
          .from('documentos_inquilino')
          .select('*')
          .eq('inquilino_id', principal.id)
        setDocumentos((docData as DocumentoInquilino[]) ?? [])
      }

      setCargando(false)
    }
    cargar()
  }, [usuario])

  const seleccionarSolicitud = async (sol: SolicitudConPropiedad) => {
    setSolicitudActual(sol)
    const { data: docData } = await supabase
      .from('documentos_inquilino')
      .select('*')
      .eq('inquilino_id', sol.id)
    setDocumentos((docData as DocumentoInquilino[]) ?? [])
  }

  const docPorTipo = (tipo: TipoDocumento) => documentos.find((d) => d.tipo === tipo) ?? null

  const handleSubir = async (tipo: TipoDocumento, file: File) => {
    if (!solicitudActual) return
    setErrorDoc(null)
    setSubiendo(tipo)

    const ext  = file.name.split('.').pop() ?? 'pdf'
    const path = `solicitud_${solicitudActual.id}/${tipo}.${ext}`

    await supabase.storage.from(BUCKET).remove([path])

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setErrorDoc(`Error subiendo archivo: ${uploadErr.message}`)
      setSubiendo(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)

    const existente = docPorTipo(tipo)
    if (existente) {
      await supabase.from('documentos_inquilino').update({ url: publicUrl, nombre_archivo: file.name }).eq('id', existente.id)
    } else {
      await supabase.from('documentos_inquilino').insert({ inquilino_id: solicitudActual.id, tipo, url: publicUrl, nombre_archivo: file.name })
    }

    const { data: docData } = await supabase.from('documentos_inquilino').select('*').eq('inquilino_id', solicitudActual.id)
    const docs = (docData as DocumentoInquilino[]) ?? []
    setDocumentos(docs)

    const tiposSubidos = new Set(docs.map((d) => d.tipo))
    const requeridos   = DOCS_CONFIG.filter((c) => c.requerido).map((c) => c.tipo)
    const todoListo    = requeridos.every((t) => tiposSubidos.has(t))
    const nuevoEstado: SolicitudArriendo['estado'] = todoListo ? 'documentos_enviados' : 'documentos_pendientes'

    await supabase.from('solicitudes_arriendo').update({ estado: nuevoEstado }).eq('id', solicitudActual.id)
    setSolicitudActual((prev) => prev ? { ...prev, estado: nuevoEstado } : prev)
    setSolicitudes((prev) => prev.map((s) => s.id === solicitudActual.id ? { ...s, estado: nuevoEstado } : s))

    setSubiendo(null)
  }

  /* ── Loading ── */
  if (cargando) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '14px', color: '#666', fontSize: '14px' }}>Cargando tu arriendo...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <p style={{ color: '#666' }}>{error}</p>
      </div>
    </div>
  )

  const sol = solicitudActual

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>Mi arriendo</h1>
          <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0 }}>Seguí el estado de tu solicitud y gestioná tus documentos</p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Sin solicitudes */}
        {solicitudes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Aún no solicitaste ningún arriendo
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Explorá las propiedades disponibles y solicitá la que más te guste.
            </p>
            <a
              href="/propiedades"
              style={{ backgroundColor: '#52B788', color: 'white', padding: '12px 32px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
            >
              Ver propiedades
            </a>
          </div>
        )}

        {/* Selector de solicitudes (si hay más de una) */}
        {solicitudes.length > 1 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px' }}>Tenés {solicitudes.length} solicitudes — mostrando:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {solicitudes.map((s) => {
                const info = ESTADO_INFO[s.estado]
                const activa = s.id === sol?.id
                return (
                  <button
                    key={s.id}
                    onClick={() => seleccionarSolicitud(s)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                      border: `1.5px solid ${activa ? '#52B788' : '#CBD5E0'}`,
                      backgroundColor: activa ? '#F0FFF4' : 'white',
                      color: activa ? '#2D6A4F' : '#555', fontWeight: activa ? 'bold' : 'normal',
                    }}
                  >
                    {info.icon} {s.propiedades?.titulo ?? 'Propiedad'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {sol && (() => {
          const info = ESTADO_INFO[sol.estado]
          const p    = sol.propiedades
          const fotos = p?.fotos?.filter(Boolean) ?? []

          return (
            <>
              {/* Estado de la solicitud */}
              <div style={{ backgroundColor: info.bg, border: `1.5px solid ${info.color}30`, borderRadius: '12px', padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '32px', flexShrink: 0 }}>{info.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: info.color, fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{info.label}</div>
                  <div style={{ color: '#555', fontSize: '14px' }}>{info.descripcion}</div>
                </div>
                <button
                  onClick={() => navigate(`/conversacion/${sol.id}`)}
                  style={{
                    backgroundColor: '#1B3A5C', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '9px 18px', fontSize: '13px',
                    fontWeight: 'bold', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  💬 Mensaje al propietario
                </button>
              </div>

              {/* Info de la propiedad */}
              {p && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                  {fotos.length > 0 && (
                    <div style={{ height: '180px', overflow: 'hidden' }}>
                      <img src={fotos[0]} alt={p.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    <h2 style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px' }}>{p.titulo}</h2>
                    <p style={{ color: '#52B788', fontSize: '13px', fontWeight: '500', margin: '0 0 12px' }}>📍 {p.zona}</p>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold' }}>Q{p.precio_quetzales.toLocaleString('es-GT')}<span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>/mes</span></span>
                      <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '13px', alignItems: 'center' }}>
                        <span>🛏 {p.habitaciones} hab.</span>
                        <span>🚿 {p.banos} baños</span>
                        <span style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{p.tipo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos: solo si aprobada o más */}
              {['aprobada', 'documentos_pendientes', 'documentos_enviados'].includes(sol.estado) && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px' }}>Mis documentos</h2>
                    <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                      Subí los documentos requeridos <span style={{ color: '#e53e3e' }}>*</span> para avanzar con el contrato.
                    </p>
                  </div>

                  {errorDoc && (
                    <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                      {errorDoc}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {DOCS_CONFIG.map((cfg) => {
                      const doc          = docPorTipo(cfg.tipo)
                      const estaSubiendo = subiendo === cfg.tipo

                      return (
                        <div
                          key={cfg.tipo}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 16px', borderRadius: '10px',
                            backgroundColor: doc ? '#F0FFF4' : '#FAFAFA',
                            border: `1.5px solid ${doc ? '#9AE6B4' : '#E2E8F0'}`,
                          }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: doc ? '#C6F6D5' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            {doc ? '✅' : cfg.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B3A5C' }}>{cfg.label}</span>
                              {cfg.requerido && <span style={{ color: '#e53e3e', fontSize: '12px' }}>*</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {doc
                                ? <><span style={{ color: '#2D6A4F', fontWeight: '500' }}>✓ Subido</span>{doc.nombre_archivo ? ` — ${doc.nombre_archivo}` : ''}</>
                                : cfg.descripcion
                              }
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            {doc && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#2D6A4F', textDecoration: 'none', padding: '5px 12px', border: '1px solid #9AE6B4', borderRadius: '6px', backgroundColor: 'white' }}
                              >
                                Ver
                              </a>
                            )}
                            <input
                              ref={(el) => { inputsRef.current[cfg.tipo] = el }}
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleSubir(cfg.tipo, file)
                                e.target.value = ''
                              }}
                            />
                            <button
                              onClick={() => inputsRef.current[cfg.tipo]?.click()}
                              disabled={estaSubiendo}
                              style={{
                                fontSize: '12px', fontWeight: 'bold',
                                padding: '5px 14px', borderRadius: '6px', border: 'none',
                                cursor: estaSubiendo ? 'not-allowed' : 'pointer',
                                backgroundColor: estaSubiendo ? '#A0AEC0' : doc ? '#1B3A5C' : '#52B788',
                                color: 'white',
                              }}
                            >
                              {estaSubiendo ? 'Subiendo...' : doc ? 'Reemplazar' : 'Subir'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progreso */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
                    {(() => {
                      const requeridos  = DOCS_CONFIG.filter((c) => c.requerido)
                      const completados = requeridos.filter((c) => docPorTipo(c.tipo)).length
                      const pct         = Math.round((completados / requeridos.length) * 100)
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                            <span>Documentos requeridos: {completados}/{requeridos.length}</span>
                            <span>{pct}%</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#52B788' : '#F6AD55', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Arriendo activo: placeholder contrato + pagos */}
              {sol.estado === 'activa' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                    <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' }}>📃 Contrato</h2>
                    <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                      La firma digital del contrato estará disponible próximamente.
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                    <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' }}>💳 Pagos de renta</h2>
                    <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                      El historial de pagos estará disponible próximamente.
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
