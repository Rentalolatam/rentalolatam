import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type SolicitudArriendo, type DocumentoInquilino, type TipoDocumento, type Contrato, type DocumentoPerfil } from '../lib/supabase'
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
  propiedades: { titulo: string; zona: string; tipo: string; precio_quetzales: number } | null
}

const ESTADO_CFG: Record<SolicitudArriendo['estado'], { label: string; bg: string; color: string }> = {
  pendiente:             { label: 'Pendiente',           bg: '#FFFBEB', color: '#92400E' },
  aprobada:              { label: 'Aprobada',            bg: '#EBF8FF', color: '#2B6CB0' },
  rechazada:             { label: 'Rechazada',           bg: '#FFF5F5', color: '#c53030' },
  documentos_pendientes: { label: 'Docs. en revisión',  bg: '#FFFBEB', color: '#92400E' },
  documentos_enviados:   { label: 'Docs. enviados',     bg: '#F0FFF4', color: '#2D6A4F' },
  activa:                { label: 'Activo',              bg: '#F0FFF4', color: '#276749' },
}

const MOSTRAR_DOCS = ['aprobada', 'documentos_pendientes', 'documentos_enviados', 'activa']

const PUEDE_CONTRATAR = ['documentos_enviados', 'activa']

const CONTRATO_CFG: Record<Contrato['estado'], { label: string; bg: string; color: string }> = {
  enviado:             { label: 'Enviado a firmar',          bg: '#EBF8FF', color: '#2B6CB0' },
  firmado_inquilino:   { label: 'Firmado por inquilino',     bg: '#FFFBEB', color: '#92400E' },
  firmado_propietario: { label: 'Firmado por propietario',   bg: '#FFFBEB', color: '#92400E' },
  completado:          { label: 'Contrato completado ✓',     bg: '#F0FFF4', color: '#276749' },
  cancelado:           { label: 'Cancelado',                 bg: '#FFF5F5', color: '#c53030' },
}

export default function DetalleInquilino() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [solicitud, setSolicitud]        = useState<SolicitudConPropiedad | null>(null)
  const [documentos, setDocumentos]      = useState<DocumentoInquilino[]>([])
  const [docsPerfilTenant, setDocsPerfilTenant] = useState<DocumentoPerfil[]>([])
  const [cargando, setCargando]          = useState(true)
  const [error, setError]                = useState<string | null>(null)

  const [subiendo, setSubiendo]      = useState<TipoDocumento | null>(null)
  const [errorDoc, setErrorDoc]      = useState<string | null>(null)
  const [aprobando, setAprobando]    = useState(false)
  const inputsRef                    = useRef<Record<string, HTMLInputElement | null>>({})

  // Contrato
  const [contrato, setContrato]              = useState<Contrato | null>(null)
  const [docusignConectado, setDocusignConectado] = useState(true)
  const [modalContrato, setModalContrato]    = useState(false)
  const [fechaInicio, setFechaInicio]        = useState('')
  const [fechaFin, setFechaFin]              = useState('')
  const [enviandoContrato, setEnviandoContrato] = useState(false)
  const [errorContrato, setErrorContrato]    = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      const [{ data: solData, error: solErr }, { data: docData }] = await Promise.all([
        supabase
          .from('solicitudes_arriendo')
          .select('*, propiedades(titulo, zona, tipo, precio_quetzales)')
          .eq('id', id)
          .single(),
        supabase
          .from('documentos_inquilino')
          .select('*')
          .eq('inquilino_id', id),
      ])
      if (solErr) setError(solErr.message)
      else {
        const sol = solData as SolicitudConPropiedad
        setSolicitud(sol)
        setDocumentos((docData as DocumentoInquilino[]) ?? [])
        // Load tenant's profile documents
        if (sol.inquilino_id) {
          const { data: pDocs } = await supabase
            .from('documentos_perfil')
            .select('*')
            .eq('user_id', sol.inquilino_id)
          setDocsPerfilTenant((pDocs as DocumentoPerfil[]) ?? [])
        }
      }
      setCargando(false)
    }
    cargar()
  }, [id])

  // Cargar contrato existente + estado DocuSign
  useEffect(() => {
    if (!id || !usuario) return
    const cargarExtras = async () => {
      const [{ data: cData }, { data: dsData }] = await Promise.all([
        supabase.from('contratos').select('*').eq('solicitud_id', id).maybeSingle(),
        supabase.from('docusign_tokens').select('expires_at').eq('user_id', usuario.id).maybeSingle(),
      ])
      if (cData) setContrato(cData as Contrato)
      setDocusignConectado(!!dsData)
    }
    cargarExtras()
  }, [id, usuario])

  const handleCrearContrato = async () => {
    if (!solicitud || !fechaInicio || !fechaFin) return
    setEnviandoContrato(true)
    setErrorContrato(null)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''
    const res = await fetch('/api/docusign/crear-contrato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ solicitud_id: solicitud.id, fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
    })
    const data = await res.json() as { contrato?: Contrato; error?: string; envelope_id?: string }
    if (!res.ok) {
      if (data.error === 'docusign_no_conectado') setDocusignConectado(false)
      else setErrorContrato(data.error ?? 'Error creando contrato')
    } else {
      if (data.contrato) setContrato(data.contrato)
      setModalContrato(false)
    }
    setEnviandoContrato(false)
  }

  const docPorTipo = (tipo: TipoDocumento) => documentos.find((d) => d.tipo === tipo) ?? null

  const handleSubir = async (tipo: TipoDocumento, file: File) => {
    if (!id) return
    setErrorDoc(null)
    setSubiendo(tipo)

    const ext  = file.name.split('.').pop() ?? 'pdf'
    const path = `solicitud_${id}/${tipo}.${ext}`

    await supabase.storage.from(BUCKET).remove([path])

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setErrorDoc(`Error subiendo ${tipo}: ${uploadErr.message}`)
      setSubiendo(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)

    const existente = docPorTipo(tipo)
    if (existente) {
      await supabase.from('documentos_inquilino').update({ url: publicUrl, nombre_archivo: file.name }).eq('id', existente.id)
    } else {
      await supabase.from('documentos_inquilino').insert({ inquilino_id: id, tipo, url: publicUrl, nombre_archivo: file.name })
    }

    const { data: docData } = await supabase.from('documentos_inquilino').select('*').eq('inquilino_id', id)
    const docs = (docData as DocumentoInquilino[]) ?? []
    setDocumentos(docs)

    const tiposSubidos = new Set(docs.map((d) => d.tipo))
    const requeridos   = DOCS_CONFIG.filter((c) => c.requerido).map((c) => c.tipo)
    const todoListo    = requeridos.every((t) => tiposSubidos.has(t))
    const nuevoEstado: SolicitudArriendo['estado'] = todoListo ? 'documentos_enviados' : 'documentos_pendientes'

    await supabase.from('solicitudes_arriendo').update({ estado: nuevoEstado }).eq('id', id)
    setSolicitud((prev) => prev ? { ...prev, estado: nuevoEstado } : prev)

    setSubiendo(null)
  }

  const handleAprobarInquilino = async () => {
    if (!id) return
    setAprobando(true)
    await supabase.from('solicitudes_arriendo').update({ estado: 'activa' }).eq('id', id)
    setSolicitud((prev) => prev ? { ...prev, estado: 'activa' } : prev)
    setAprobando(false)
  }

  /* ── Render estados ── */
  if (cargando) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '14px', color: '#666', fontSize: '14px' }}>Cargando perfil...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (error || !solicitud) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <p style={{ color: '#666' }}>{error ?? 'Solicitud no encontrada.'}</p>
        <button onClick={() => navigate('/inquilinos')} style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>
          Volver a inquilinos
        </button>
      </div>
    </div>
  )

  const sol    = solicitud
  const esCfg  = ESTADO_CFG[sol.estado]
  const iniciales = (sol.inquilino_nombre ?? 'IN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const mostrarDocs   = MOSTRAR_DOCS.includes(sol.estado)
  const mostrarAprobar = ['aprobada', 'documentos_pendientes', 'documentos_enviados'].includes(sol.estado)

  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '14px 40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          <button onClick={() => navigate('/inquilinos')} style={{ background: 'none', border: 'none', color: '#CBD5E0', cursor: 'pointer', padding: 0, fontSize: '13px' }}>
            Inquilinos
          </button>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: '#52B788' }}>{sol.inquilino_nombre ?? 'Inquilino'}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Encabezado */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', flexShrink: 0 }}>
            {iniciales}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ color: '#1B3A5C', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
                {sol.inquilino_nombre ?? 'Inquilino'}
              </h1>
              <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: esCfg.bg, color: esCfg.color }}>
                {esCfg.label}
              </span>
            </div>
            {sol.propiedades && (
              <p style={{ color: '#52B788', fontSize: '14px', margin: 0, fontWeight: '500' }}>
                📍 {sol.propiedades.titulo} · {sol.propiedades.zona}
              </p>
            )}
          </div>

          {/* Botón aprobar inquilino */}
          {mostrarAprobar && (
            <button
              onClick={handleAprobarInquilino}
              disabled={aprobando}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                backgroundColor: aprobando ? '#A0AEC0' : '#52B788',
                color: 'white', fontSize: '14px', fontWeight: 'bold',
                cursor: aprobando ? 'not-allowed' : 'pointer', flexShrink: 0,
              }}
            >
              {aprobando ? 'Procesando...' : '✓ Aprobar inquilino'}
            </button>
          )}

          {sol.estado === 'activa' && (
            <div style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: '8px', padding: '8px 16px' }}>
              <span style={{ color: '#276749', fontSize: '13px', fontWeight: 'bold' }}>🏡 Arriendo activo</span>
            </div>
          )}

          <button
            onClick={() => navigate(`/conversacion/${id}`)}
            style={{ backgroundColor: 'white', color: '#1B3A5C', border: '1.5px solid #1B3A5C', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
          >
            💬 Ver conversación
          </button>
        </div>

        {/* Info de la solicitud */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>Información de la solicitud</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Estado',     val: esCfg.label },
              { label: 'Propiedad', val: sol.propiedades?.titulo ?? '—' },
              { label: 'Zona',      val: sol.propiedades?.zona ?? '—' },
              { label: 'Precio',    val: sol.propiedades ? `Q${sol.propiedades.precio_quetzales.toLocaleString('es-GT')}/mes` : '—' },
              { label: 'Solicitud', val: new Date(sol.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1B3A5C' }}>{val}</div>
              </div>
            ))}
          </div>

          {sol.mensaje && (
            <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FED7AA' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Mensaje del inquilino</div>
              <p style={{ color: '#555', fontSize: '14px', margin: 0, fontStyle: 'italic', lineHeight: '1.6' }}>
                "{sol.mensaje}"
              </p>
            </div>
          )}
        </div>

        {/* Documentos (solo si está aprobada o más) */}
        {mostrarDocs && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px' }}>Documentos para contrato</h2>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                Los marcados con <span style={{ color: '#e53e3e' }}>*</span> son requeridos para marcar al inquilino como Listo.
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

        {/* ── DOCUMENTOS DE PERFIL DEL INQUILINO (read-only) ── */}
        {docsPerfilTenant.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>📋 Documentos de perfil del inquilino</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {docsPerfilTenant.map((doc) => {
                const labels: Record<string, string> = {
                  dpi: 'DPI / Pasaporte',
                  comprobante_ingresos: 'Comprobante de ingresos',
                  carta_trabajo: 'Carta de trabajo',
                  referencias: 'Cartas de referencia',
                }
                return (
                  <div
                    key={doc.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#F0FFF4', border: '1.5px solid #9AE6B4' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#C6F6D5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      ✅
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B3A5C' }}>{labels[doc.tipo] ?? doc.tipo}</span>
                      {doc.nombre_archivo && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{doc.nombre_archivo}</div>}
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: '#2D6A4F', textDecoration: 'none', padding: '5px 12px', border: '1px solid #9AE6B4', borderRadius: '6px', backgroundColor: 'white' }}
                    >
                      Ver
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SECCIÓN CONTRATO ── */}
        {PUEDE_CONTRATAR.includes(sol.estado) && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>📃 Contrato digital</h2>

            {/* Contrato ya existente */}
            {contrato ? (
              <div>
                {(() => {
                  const cfg = CONTRATO_CFG[contrato.estado]
                  return (
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0' }}>
                          Período: {contrato.fecha_inicio ? new Date(contrato.fecha_inicio + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {' al '}
                          {contrato.fecha_fin ? new Date(contrato.fecha_fin + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0' }}>
                          Envelope ID: {contrato.envelope_id}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* Sin contrato — botón o conexión DocuSign */
              <div>
                {!docusignConectado ? (
                  <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FED7AA', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ color: '#92400E', fontSize: '14px', margin: '0 0 12px', fontWeight: '500' }}>
                      Conectá tu cuenta de DocuSign para enviar contratos para firma digital.
                    </p>
                    <a
                      href={`/api/docusign/auth?user_id=${usuario?.id ?? ''}`}
                      style={{ display: 'inline-block', backgroundColor: '#1B3A5C', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      Conectar DocuSign
                    </a>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#666', fontSize: '13px', margin: '0 0 14px' }}>
                      Generá el contrato de arrendamiento y envialo a ambas partes para firma digital vía DocuSign.
                    </p>
                    {errorContrato && (
                      <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '12px' }}>
                        {errorContrato}
                      </div>
                    )}
                    <button
                      onClick={() => setModalContrato(true)}
                      style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Generar y enviar contrato
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Volver */}
        <div>
          <button onClick={() => navigate('/inquilinos')} style={{ background: 'none', border: 'none', color: '#2D6A4F', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
            ← Volver a inquilinos
          </button>
        </div>
      </div>
    </div>

    {/* MODAL contrato */}
    {modalContrato && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '19px', fontWeight: 'bold', margin: '0 0 6px' }}>Generar contrato</h2>
          <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>
            Se enviará un email a ambas partes con el contrato para firma digital vía DocuSign.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Fecha de inicio *</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Fecha de fin *</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {errorContrato && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
              {errorContrato}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setModalContrato(false); setErrorContrato(null) }}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #CBD5E0', color: '#666', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrearContrato}
              disabled={enviandoContrato || !fechaInicio || !fechaFin}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: (enviandoContrato || !fechaInicio || !fechaFin) ? '#A0AEC0' : '#52B788', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: (enviandoContrato || !fechaInicio || !fechaFin) ? 'not-allowed' : 'pointer' }}
            >
              {enviandoContrato ? 'Enviando...' : 'Enviar a firmar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
