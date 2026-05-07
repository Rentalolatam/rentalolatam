import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const TIPO_CAMBIO = 7.75
const MIN_FOTOS = 3
const MAX_FOTOS = 10
const BUCKET = 'propiedades-fotos'

type FormData = {
  titulo: string
  tipo: string
  pais: string
  zona: string
  precio_quetzales: string
  incluye_iva: boolean
  incluye_mantenimiento: boolean
  habitaciones: string
  banos: string
  tiene_parqueo: boolean
  cantidad_parqueos: string
  amueblado: boolean
  metraje_sin_parqueo: string
  metraje_con_parqueo: string
  descripcion: string
  estado: string
}

type FotoLocal = {
  file: File | null
  previewUrl: string
  esExistente: boolean
}

export default function EditarPropiedad() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const inputFileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    titulo: '', tipo: 'Apartamento', pais: 'Guatemala', zona: '',
    precio_quetzales: '', incluye_iva: false, incluye_mantenimiento: false,
    habitaciones: '', banos: '', tiene_parqueo: false, cantidad_parqueos: '',
    amueblado: false, metraje_sin_parqueo: '', metraje_con_parqueo: '',
    descripcion: '', estado: 'disponible',
  })
  const [fotos, setFotos]           = useState<FotoLocal[]>([])
  const [cargando, setCargando]     = useState(true)
  const [enviando, setEnviando]     = useState(false)
  const [progreso, setProgreso]     = useState<{ actual: number; total: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const precioDolares = form.precio_quetzales
    ? (parseFloat(form.precio_quetzales) / TIPO_CAMBIO).toFixed(2)
    : ''

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      const { data, error: err } = await supabase
        .from('propiedades')
        .select('*')
        .eq('id', id)
        .single()

      if (err || !data) {
        setError('No se pudo cargar la propiedad.')
        setCargando(false)
        return
      }

      const p = data as Propiedad
      setForm({
        titulo: p.titulo,
        tipo: p.tipo,
        pais: p.pais,
        zona: p.zona,
        precio_quetzales: String(p.precio_quetzales),
        incluye_iva: p.incluye_iva,
        incluye_mantenimiento: p.incluye_mantenimiento,
        habitaciones: String(p.habitaciones),
        banos: String(p.banos),
        tiene_parqueo: p.tiene_parqueo,
        cantidad_parqueos: p.cantidad_parqueos ? String(p.cantidad_parqueos) : '',
        amueblado: p.amueblado,
        metraje_sin_parqueo: p.metraje_sin_parqueo ? String(p.metraje_sin_parqueo) : '',
        metraje_con_parqueo: p.metraje_con_parqueo ? String(p.metraje_con_parqueo) : '',
        descripcion: p.descripcion ?? '',
        estado: p.estado,
      })
      setFotos((p.fotos ?? []).map(url => ({ file: null, previewUrl: url, esExistente: true })))
      setCargando(false)
    }
    cargar()
  }, [id])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    },
    []
  )

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? [])
    if (!archivos.length) return
    const nuevas: FotoLocal[] = archivos.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      esExistente: false,
    }))
    setFotos(prev => [...prev, ...nuevas].slice(0, MAX_FOTOS))
    e.target.value = ''
  }

  const quitarFoto = (index: number) => {
    setFotos(prev => {
      const f = prev[index]
      if (!f.esExistente) URL.revokeObjectURL(f.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (fotos.length < MIN_FOTOS) {
      setError(`Debés tener al menos ${MIN_FOTOS} fotos.`)
      return
    }

    setEnviando(true)
    const fotosNuevas = fotos.filter(f => !f.esExistente)
    setProgreso({ actual: 0, total: fotosNuevas.length })

    const fotosUrls: string[] = []
    const userId = usuario?.id ?? 'anonimo'

    // Subir solo fotos nuevas
    for (let i = 0; i < fotosNuevas.length; i++) {
      const { file } = fotosNuevas[i]
      if (!file) continue
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}_${i}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (uploadError) {
        setError(`Error subiendo foto ${i + 1}: ${uploadError.message}`)
        setEnviando(false)
        setProgreso(null)
        return
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
      fotosUrls.push(urlData.publicUrl)
      setProgreso({ actual: i + 1, total: fotosNuevas.length })
    }

    // Combinar URLs existentes con nuevas (preservar orden)
    const todasUrls = fotos.map(f => f.esExistente ? f.previewUrl : null)
    let nuevoIdx = 0
    const finalUrls = todasUrls.map(u => u !== null ? u : fotosUrls[nuevoIdx++])

    const { error: sbError } = await supabase
      .from('propiedades')
      .update({
        titulo: form.titulo,
        tipo: form.tipo,
        pais: form.pais,
        zona: form.zona,
        precio_quetzales: parseFloat(form.precio_quetzales),
        precio_dolares: parseFloat(precioDolares),
        incluye_iva: form.incluye_iva,
        incluye_mantenimiento: form.incluye_mantenimiento,
        habitaciones: parseInt(form.habitaciones),
        banos: parseInt(form.banos),
        tiene_parqueo: form.tiene_parqueo,
        cantidad_parqueos: form.tiene_parqueo ? parseInt(form.cantidad_parqueos) || null : null,
        amueblado: form.amueblado,
        metraje_sin_parqueo: form.metraje_sin_parqueo ? parseFloat(form.metraje_sin_parqueo) : null,
        metraje_con_parqueo: form.metraje_con_parqueo ? parseFloat(form.metraje_con_parqueo) : null,
        descripcion: form.descripcion || null,
        fotos: finalUrls,
        estado: form.estado,
      })
      .eq('id', id)

    setEnviando(false)
    setProgreso(null)

    if (sbError) {
      setError(`Error al guardar: ${sbError.message}`)
      return
    }

    navigate('/dashboard')
  }

  const porcentaje = progreso && progreso.total > 0
    ? Math.round((progreso.actual / progreso.total) * 100)
    : 100

  if (cargando) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#52B788', borderTopColor: 'transparent' }} />
          <p className="mt-4 text-sm" style={{ color: '#666' }}>Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              style={{ color: '#52B788', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ← Mi dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B3A5C' }}>Editar propiedad</h1>
          <p className="mt-1 text-sm" style={{ color: '#666' }}>Actualizá los datos de tu propiedad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Información básica */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B3A5C' }}>Información básica</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                  Título de la propiedad <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  name="titulo" value={form.titulo} onChange={handleChange} required
                  placeholder="Ej: Apartamento moderno en Zona 10"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#CBD5E0' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Tipo <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  >
                    <option>Apartamento</option>
                    <option>Casa</option>
                    <option>Estudio</option>
                    <option>Loft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>País</label>
                  <select name="pais" value={form.pais} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  >
                    <option>Guatemala</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                  Zona / Sector <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  name="zona" value={form.zona} onChange={handleChange} required
                  placeholder="Ej: Zona 10, Zona 14, Cayalá..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#CBD5E0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                  Estado <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <select name="estado" value={form.estado} onChange={handleChange} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#CBD5E0' }}
                >
                  <option value="disponible">Disponible</option>
                  <option value="arrendado">Arrendado</option>
                  <option value="en mantenimiento">En mantenimiento</option>
                </select>
              </div>
            </div>
          </section>

          {/* Precio */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B3A5C' }}>Precio</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Precio en quetzales (Q) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    name="precio_quetzales" type="number" min="0" step="0.01"
                    value={form.precio_quetzales} onChange={handleChange} required
                    placeholder="Ej: 4500"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Precio en dólares (USD)
                  </label>
                  <input
                    type="text" value={precioDolares ? `$${precioDolares}` : ''} readOnly
                    placeholder="Calculado automáticamente"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: '#CBD5E0', backgroundColor: '#F8F9FA', color: '#666' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#999' }}>Tipo de cambio: Q7.75 = $1</p>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="incluye_iva" checked={form.incluye_iva} onChange={handleChange}
                    className="w-4 h-4 rounded" style={{ accentColor: '#52B788' }} />
                  <span className="text-sm" style={{ color: '#333' }}>Precio incluye IVA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="incluye_mantenimiento" checked={form.incluye_mantenimiento} onChange={handleChange}
                    className="w-4 h-4 rounded" style={{ accentColor: '#52B788' }} />
                  <span className="text-sm" style={{ color: '#333' }}>Precio incluye mantenimiento</span>
                </label>
              </div>
            </div>
          </section>

          {/* Características */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B3A5C' }}>Características</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Habitaciones <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input name="habitaciones" type="number" min="0" value={form.habitaciones} onChange={handleChange} required
                    placeholder="Ej: 2"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Baños <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input name="banos" type="number" min="0" value={form.banos} onChange={handleChange} required
                    placeholder="Ej: 2"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Metraje sin parqueo (m²)
                  </label>
                  <input name="metraje_sin_parqueo" type="number" min="0" step="0.01"
                    value={form.metraje_sin_parqueo} onChange={handleChange} placeholder="Ej: 85"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Metraje con parqueo (m²)
                  </label>
                  <input name="metraje_con_parqueo" type="number" min="0" step="0.01"
                    value={form.metraje_con_parqueo} onChange={handleChange} placeholder="Ej: 110"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
              </div>

              <div className="flex gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="amueblado" checked={form.amueblado} onChange={handleChange}
                    className="w-4 h-4 rounded" style={{ accentColor: '#52B788' }} />
                  <span className="text-sm" style={{ color: '#333' }}>Amueblado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="tiene_parqueo" checked={form.tiene_parqueo} onChange={handleChange}
                    className="w-4 h-4 rounded" style={{ accentColor: '#52B788' }} />
                  <span className="text-sm" style={{ color: '#333' }}>Tiene parqueo</span>
                </label>
                {form.tiene_parqueo && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm" style={{ color: '#333' }}>Cantidad de parqueos:</label>
                    <input name="cantidad_parqueos" type="number" min="1" value={form.cantidad_parqueos} onChange={handleChange}
                      className="border rounded-lg px-3 py-1 text-sm w-20 focus:outline-none"
                      style={{ borderColor: '#CBD5E0' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Descripción */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B3A5C' }}>Descripción</h2>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={5}
              placeholder="Describí tu propiedad: amenidades, ubicación, características especiales..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ borderColor: '#CBD5E0' }}
            />
          </section>

          {/* Fotos */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#1B3A5C' }}>Fotos</h2>
            <p className="text-xs mb-5" style={{ color: '#666' }}>
              Podés agregar o quitar fotos. Mínimo {MIN_FOTOS}, máximo {MAX_FOTOS}.
            </p>

            {fotos.length < MAX_FOTOS && (
              <>
                <input ref={inputFileRef} type="file" accept="image/*" multiple
                  onChange={handleSeleccionarArchivos} style={{ display: 'none' }} />
                <button type="button" onClick={() => inputFileRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: '#CBD5E0', backgroundColor: '#FAFAFA', cursor: 'pointer', color: '#666' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#52B788')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E0')}
                >
                  <span style={{ fontSize: '32px' }}>📷</span>
                  <span className="text-sm font-medium">Hacé click para agregar fotos</span>
                  <span className="text-xs" style={{ color: '#999' }}>
                    JPG, PNG, WEBP — {fotos.length}/{MAX_FOTOS} fotos
                  </span>
                </button>
              </>
            )}

            {fotos.length > 0 && (
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {fotos.map((foto, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: '#E2E8F0' }}>
                    <img src={foto.previewUrl} alt={`foto ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute', top: '6px', left: '6px',
                      backgroundColor: 'rgba(0,0,0,0.55)', color: 'white',
                      borderRadius: '999px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold',
                    }}>{i + 1}</span>
                    {foto.esExistente && (
                      <span style={{
                        position: 'absolute', bottom: '6px', left: '6px',
                        backgroundColor: 'rgba(43,108,176,0.8)', color: 'white',
                        borderRadius: '4px', padding: '1px 5px', fontSize: '9px',
                      }}>guardada</span>
                    )}
                    <button type="button" onClick={() => quitarFoto(i)} style={{
                      position: 'absolute', top: '6px', right: '6px',
                      backgroundColor: 'rgba(229,62,62,0.85)', color: 'white',
                      border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs" style={{ color: fotos.length < MIN_FOTOS ? '#e53e3e' : '#2D6A4F', fontWeight: '500' }}>
                {fotos.length < MIN_FOTOS
                  ? `Faltan ${MIN_FOTOS - fotos.length} foto${MIN_FOTOS - fotos.length !== 1 ? 's' : ''} más`
                  : `✓ ${fotos.length} foto${fotos.length !== 1 ? 's' : ''}`}
              </span>
              {fotos.length >= MAX_FOTOS && (
                <span className="text-xs" style={{ color: '#999' }}>Límite máximo alcanzado</span>
              )}
            </div>

            {progreso && progreso.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#555' }}>
                  <span>Subiendo foto {progreso.actual} de {progreso.total}...</span>
                  <span>{porcentaje}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: '#E2E8F0' }}>
                  <div style={{
                    height: '100%', backgroundColor: '#52B788',
                    width: `${porcentaje}%`, transition: 'width 0.3s ease', borderRadius: '999px',
                  }} />
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: '#FFF5F5', color: '#c53030', border: '1px solid #FEB2B2' }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pb-10">
            <Link to="/dashboard"
              className="px-6 py-3 rounded-lg text-sm font-medium border"
              style={{ color: '#666', borderColor: '#CBD5E0', backgroundColor: 'white' }}
            >
              Cancelar
            </Link>
            <button type="submit"
              disabled={enviando || fotos.length < MIN_FOTOS}
              className="px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{
                backgroundColor: (enviando || fotos.length < MIN_FOTOS) ? '#A0AEC0' : '#52B788',
                cursor: (enviando || fotos.length < MIN_FOTOS) ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando
                ? progreso && progreso.total > 0
                  ? `Subiendo fotos (${progreso.actual}/${progreso.total})...`
                  : 'Guardando...'
                : 'Guardar cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
