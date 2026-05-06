import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, type Inquilino, type DocumentoInquilino, type TipoDocumento } from '../lib/supabase'
import Navbar from '../components/Navbar'

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

const ESTADO_CFG = {
  basico:                { label: 'Básico',             bg: '#F7FAFC', color: '#4A5568' },
  documentos_pendientes: { label: 'Docs. pendientes',   bg: '#FFFBEB', color: '#92400E' },
  listo:                 { label: 'Listo',              bg: '#F0FFF4', color: '#2D6A4F' },
}

export default function DetalleInquilino() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [inquilino, setInquilino]   = useState<Inquilino | null>(null)
  const [documentos, setDocumentos] = useState<DocumentoInquilino[]>([])
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // subiendo: tipo doc que se está subiendo actualmente
  const [subiendo, setSubiendo] = useState<TipoDocumento | null>(null)
  const [errorDoc, setErrorDoc] = useState<string | null>(null)
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      const [{ data: inqData, error: inqErr }, { data: docData }] = await Promise.all([
        supabase.from('inquilinos').select('*').eq('id', id).single(),
        supabase.from('documentos_inquilino').select('*').eq('inquilino_id', id),
      ])
      if (inqErr) setError(inqErr.message)
      else if (!docData) setError('Error cargando documentos')
      else {
        setInquilino(inqData as Inquilino)
        setDocumentos((docData as DocumentoInquilino[]) ?? [])
      }
      setCargando(false)
    }
    cargar()
  }, [id])

  const docPorTipo = (tipo: TipoDocumento) => documentos.find((d) => d.tipo === tipo) ?? null

  const handleSubir = async (tipo: TipoDocumento, file: File) => {
    setErrorDoc(null)
    setSubiendo(tipo)

    const ext  = file.name.split('.').pop() ?? 'pdf'
    const path = `${id}/${tipo}.${ext}`

    // Eliminar archivo previo si existe
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

    // Upsert en tabla documentos_inquilino
    const existente = docPorTipo(tipo)
    if (existente) {
      await supabase.from('documentos_inquilino').update({ url: publicUrl, nombre_archivo: file.name }).eq('id', existente.id)
    } else {
      await supabase.from('documentos_inquilino').insert({ inquilino_id: id, tipo, url: publicUrl, nombre_archivo: file.name })
    }

    // Refrescar documentos y actualizar estado del inquilino
    const { data: docData } = await supabase.from('documentos_inquilino').select('*').eq('inquilino_id', id)
    const docs = (docData as DocumentoInquilino[]) ?? []
    setDocumentos(docs)

    const tiposSubidos = new Set(docs.map((d) => d.tipo))
    const requeridos   = DOCS_CONFIG.filter((c) => c.requerido).map((c) => c.tipo)
    const todoListo    = requeridos.every((t) => tiposSubidos.has(t))
    const nuevoEstado  = todoListo ? 'listo' : tiposSubidos.size > 0 ? 'documentos_pendientes' : 'basico'

    await supabase.from('inquilinos').update({ estado: nuevoEstado }).eq('id', id)
    setInquilino((prev) => prev ? { ...prev, estado: nuevoEstado as Inquilino['estado'] } : prev)

    setSubiendo(null)
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

  if (error || !inquilino) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <p style={{ color: '#666' }}>{error ?? 'Inquilino no encontrado.'}</p>
        <button onClick={() => navigate('/inquilinos')} style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>
          Volver a inquilinos
        </button>
      </div>
    </div>
  )

  const inq   = inquilino
  const esCfg = ESTADO_CFG[inq.estado]
  const iniciales = inq.nombre_completo.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '14px 40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          <Link to="/inquilinos" style={{ color: '#CBD5E0', textDecoration: 'none' }}>Inquilinos</Link>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: '#52B788' }}>{inq.nombre_completo}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Encabezado del perfil */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', flexShrink: 0 }}>
            {iniciales}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ color: '#1B3A5C', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{inq.nombre_completo}</h1>
              <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: esCfg.bg, color: esCfg.color }}>
                {esCfg.label}
              </span>
            </div>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{inq.email}</p>
          </div>
        </div>

        {/* Datos personales */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 18px' }}>Datos personales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Teléfono',          val: inq.telefono ?? '—' },
              { label: 'Fecha de nac.',     val: inq.fecha_nacimiento ? new Date(inq.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Nacionalidad',      val: inq.nacionalidad },
              { label: 'Tipo documento',    val: inq.tipo_documento ?? '—' },
              { label: 'No. documento',     val: inq.numero_documento ?? '—' },
              { label: 'Registrado',        val: new Date(inq.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1B3A5C' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentos para contrato */}
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
              const doc        = docPorTipo(cfg.tipo)
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
                  {/* Icono + estado */}
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: doc ? '#C6F6D5' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {doc ? '✅' : cfg.icon}
                  </div>

                  {/* Info */}
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

                  {/* Acciones */}
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
                    {/* Input file oculto */}
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
                        padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: estaSubiendo ? 'not-allowed' : 'pointer',
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

          {/* Progreso general */}
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

        {/* Volver */}
        <div>
          <button onClick={() => navigate('/inquilinos')} style={{ background: 'none', border: 'none', color: '#2D6A4F', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
            ← Volver a inquilinos
          </button>
        </div>
      </div>
    </div>
  )
}
