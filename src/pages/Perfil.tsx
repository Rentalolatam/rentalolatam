import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, type Perfil, type DocumentoPerfil, type TipoDocumentoPerfil } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { PAISES } from '../data/geografia'

const CAMPOS_REQUERIDOS: (keyof Perfil)[] = [
  'nombre_completo', 'tipo_documento', 'numero_documento', 'telefono', 'pais',
]

type DocConfig = {
  tipo: TipoDocumentoPerfil
  label: string
  descripcion: string
  icon: string
}

const DOCS_PERFIL: DocConfig[] = [
  { tipo: 'dpi',                 label: 'DPI / Pasaporte',          descripcion: 'Foto o scan de tu documento de identidad', icon: '🪪' },
  { tipo: 'comprobante_ingresos', label: 'Comprobante de ingresos',  descripcion: 'Estado de cuenta, recibo de salario, etc.', icon: '💼' },
  { tipo: 'carta_trabajo',       label: 'Carta de trabajo',         descripcion: 'Carta laboral emitida por tu empleador',    icon: '📄' },
  { tipo: 'referencias',         label: 'Cartas de referencia',     descripcion: 'Referencia personal o comercial',          icon: '✉️'  },
]

const BUCKET_FOTOS  = 'fotos-perfil'
const BUCKET_DOCS   = 'documentos-inquilinos'

export default function PerfilPage() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const nextUrl     = params.get('next')

  const [perfil, setPerfil] = useState<Partial<Perfil>>({})
  const [docs, setDocs]     = useState<DocumentoPerfil[]>([])
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msgOk, setMsgOk]         = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [subiendoFoto, setSubiendoFoto]   = useState(false)
  const [subiendoDoc, setSubiendoDoc]     = useState<TipoDocumentoPerfil | null>(null)

  const fotoRef = useRef<HTMLInputElement | null>(null)
  const docRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      setCargando(true)
      const [{ data: pData }, { data: dData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', usuario.id).maybeSingle(),
        supabase.from('documentos_perfil').select('*').eq('user_id', usuario.id),
      ])
      setPerfil((pData as Perfil) ?? { id: usuario.id })
      setDocs((dData as DocumentoPerfil[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [usuario])

  const calcularProgreso = () => {
    const rellenos = CAMPOS_REQUERIDOS.filter((c) => !!(perfil as Record<string, unknown>)[c])
    return Math.round((rellenos.length / CAMPOS_REQUERIDOS.length) * 100)
  }

  const handleGuardar = async () => {
    if (!usuario) return
    setError(null)
    setGuardando(true)

    const todosRellenos = CAMPOS_REQUERIDOS.every((c) => !!(perfil as Record<string, unknown>)[c])

    const payload = {
      id: usuario.id,
      nombre_completo:   perfil.nombre_completo   ?? null,
      tipo_documento:    perfil.tipo_documento    ?? null,
      numero_documento:  perfil.numero_documento  ?? null,
      telefono:          perfil.telefono          ?? null,
      pais:              perfil.pais              ?? null,
      edad:              perfil.edad              ?? null,
      sexo:              perfil.sexo              ?? null,
      foto_url:          perfil.foto_url          ?? null,
      perfil_completo:   todosRellenos,
      updated_at:        new Date().toISOString(),
    }

    const { error: sbErr } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    setGuardando(false)

    if (sbErr) {
      setError(`Error guardando perfil: ${sbErr.message}`)
      return
    }

    setPerfil((prev) => ({ ...prev, perfil_completo: todosRellenos }))
    setMsgOk(true)
    setTimeout(() => setMsgOk(false), 3000)

    if (nextUrl && todosRellenos) {
      navigate(nextUrl)
    }
  }

  const handleSubirFoto = async (file: File) => {
    if (!usuario) return
    setSubiendoFoto(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${usuario.id}/avatar.${ext}`
    const { data, error: err } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(path, file, { upsert: true })
    if (err) { setError(`Error subiendo foto: ${err.message}`); setSubiendoFoto(false); return }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(data.path)
    setPerfil((prev) => ({ ...prev, foto_url: publicUrl }))
    setSubiendoFoto(false)
  }

  const handleSubirDoc = async (tipo: TipoDocumentoPerfil, file: File) => {
    if (!usuario) return
    setSubiendoDoc(tipo)
    const ext  = file.name.split('.').pop() ?? 'pdf'
    const path = `perfil/${usuario.id}/${tipo}.${ext}`
    const { data, error: err } = await supabase.storage
      .from(BUCKET_DOCS)
      .upload(path, file, { upsert: true })
    if (err) { setError(`Error subiendo documento: ${err.message}`); setSubiendoDoc(null); return }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_DOCS).getPublicUrl(data.path)

    const existente = docs.find((d) => d.tipo === tipo)
    if (existente) {
      await supabase.from('documentos_perfil').update({ url: publicUrl, nombre_archivo: file.name }).eq('id', existente.id)
    } else {
      await supabase.from('documentos_perfil').insert({ user_id: usuario.id, tipo, url: publicUrl, nombre_archivo: file.name })
    }

    const { data: dData } = await supabase.from('documentos_perfil').select('*').eq('user_id', usuario.id)
    setDocs((dData as DocumentoPerfil[]) ?? [])
    setSubiendoDoc(null)
  }

  const set = (field: keyof Perfil, value: unknown) =>
    setPerfil((prev) => ({ ...prev, [field]: value }))

  const pct = calcularProgreso()

  if (!usuario) return null

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px' }}>Mi perfil</h1>
          <p style={{ color: '#CBD5E0', fontSize: '14px', margin: 0 }}>
            Completá tu perfil para publicar propiedades y solicitar arriendos
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Banner si viene de una acción bloqueada */}
        {nextUrl && (
          <div style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FED7AA', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🔒</span>
            <p style={{ color: '#92400E', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Para continuar necesitás completar tu perfil. Esto nos permite garantizar la seguridad y confianza de todos los usuarios en la plataforma.
            </p>
          </div>
        )}

        {/* Progreso */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B3A5C' }}>
              Perfil completado
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: pct === 100 ? '#2D6A4F' : '#92400E' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#52B788' : '#F6AD55', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
          {pct < 100 && (
            <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0' }}>
              Completá los campos obligatorios para activar tu perfil.
            </p>
          )}
          {pct === 100 && (
            <p style={{ color: '#2D6A4F', fontSize: '12px', margin: '8px 0 0', fontWeight: '500' }}>
              ✓ Tu perfil está completo. Podés publicar propiedades y solicitar arriendos.
            </p>
          )}
        </div>

        {/* FOTO DE PERFIL */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px' }}>Foto de perfil</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: '#E2E8F0', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #E2E8F0',
            }}>
              {perfil.foto_url ? (
                <img src={perfil.foto_url} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px', color: '#A0AEC0' }}>👤</span>
              )}
            </div>
            <div>
              <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubirFoto(f); e.target.value = '' }} />
              <button
                onClick={() => fotoRef.current?.click()}
                disabled={subiendoFoto}
                style={{ backgroundColor: subiendoFoto ? '#A0AEC0' : '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 'bold', cursor: subiendoFoto ? 'not-allowed' : 'pointer' }}
              >
                {subiendoFoto ? 'Subiendo...' : perfil.foto_url ? 'Cambiar foto' : 'Subir foto'}
              </button>
              <p style={{ color: '#999', fontSize: '12px', margin: '6px 0 0' }}>JPG, PNG — máx. 5 MB. Opcional.</p>
            </div>
          </div>
        </div>

        {/* DATOS PERSONALES */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 20px' }}>Datos personales</h2>

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Nombre completo */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                Nombre completo <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input
                type="text"
                value={perfil.nombre_completo ?? ''}
                onChange={(e) => set('nombre_completo', e.target.value)}
                placeholder="Ej: María García López"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Documento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                  Tipo doc. <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <select
                  value={perfil.tipo_documento ?? ''}
                  onChange={(e) => set('tipo_documento', e.target.value || null)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }}
                >
                  <option value="">Seleccioná</option>
                  <option value="DPI">DPI</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                  Número de documento <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="text"
                  value={perfil.numero_documento ?? ''}
                  onChange={(e) => set('numero_documento', e.target.value)}
                  placeholder="Ej: 1234567890101"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            {/* Teléfono y País */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                  Teléfono <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={perfil.telefono ?? ''}
                  onChange={(e) => set('telefono', e.target.value)}
                  placeholder="Ej: +502 5555-0000"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
                  País <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <select
                  value={perfil.pais ?? ''}
                  onChange={(e) => set('pais', e.target.value || null)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }}
                >
                  <option value="">Seleccioná</option>
                  {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Edad y Sexo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Edad</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={perfil.edad ?? ''}
                  onChange={(e) => set('edad', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ej: 28"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Sexo</label>
                <select
                  value={perfil.sexo ?? ''}
                  onChange={(e) => set('sexo', e.target.value || null)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }}
                >
                  <option value="">Prefiero no decir</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
              </div>
            </div>

          </div>

          {/* Guardar */}
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              style={{
                backgroundColor: guardando ? '#A0AEC0' : '#52B788',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '11px 28px', fontSize: '14px', fontWeight: 'bold',
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar perfil'}
            </button>
            {msgOk && (
              <span style={{ color: '#2D6A4F', fontSize: '13px', fontWeight: '500' }}>
                ✓ Perfil guardado
              </span>
            )}
          </div>
        </div>

        {/* MIS DOCUMENTOS */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px' }}>Mis documentos</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
              Subí tus documentos de antemano para agilizar el proceso de arriendo. Los propietarios podrán verlos al revisar tu solicitud.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DOCS_PERFIL.map((cfg) => {
              const doc         = docs.find((d) => d.tipo === cfg.tipo)
              const cargandoEst = subiendoDoc === cfg.tipo

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
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B3A5C' }}>{cfg.label}</span>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {doc
                        ? <><span style={{ color: '#2D6A4F', fontWeight: '500' }}>✓ Subido</span>{doc.nombre_archivo ? ` — ${doc.nombre_archivo}` : ''}</>
                        : cfg.descripcion
                      }
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {doc && (
                      <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2D6A4F', textDecoration: 'none', padding: '5px 12px', border: '1px solid #9AE6B4', borderRadius: '6px', backgroundColor: 'white' }}>
                        Ver
                      </a>
                    )}
                    <input
                      ref={(el) => { docRefs.current[cfg.tipo] = el }}
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubirDoc(cfg.tipo, f); e.target.value = '' }}
                    />
                    <button
                      onClick={() => docRefs.current[cfg.tipo]?.click()}
                      disabled={cargandoEst}
                      style={{
                        fontSize: '12px', fontWeight: 'bold', padding: '5px 14px',
                        borderRadius: '6px', border: 'none',
                        backgroundColor: cargandoEst ? '#A0AEC0' : doc ? '#1B3A5C' : '#52B788',
                        color: 'white', cursor: cargandoEst ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cargandoEst ? 'Subiendo...' : doc ? 'Reemplazar' : 'Subir'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
