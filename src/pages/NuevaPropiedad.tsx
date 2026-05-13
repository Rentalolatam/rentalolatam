import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { DEPARTAMENTOS_GUATEMALA, ZONAS_CIUDAD_GUATEMALA, PAISES } from '../data/geografia'

const TIPO_CAMBIO_POR_PAIS: Record<string, number> = {
  'Guatemala':   7.75,
  'Costa Rica':  510,
  'El Salvador': 1.00,
  'Honduras':    24.50,
  'Nicaragua':   36.50,
  'Panamá':      1.00,
}

const MONEDA_POR_PAIS: Record<string, { simbolo: string; codigo: string }> = {
  'Guatemala':   { simbolo: 'Q',   codigo: 'GTQ' },
  'Costa Rica':  { simbolo: '₡',   codigo: 'CRC' },
  'El Salvador': { simbolo: '$',   codigo: 'USD' },
  'Honduras':    { simbolo: 'L',   codigo: 'HNL' },
  'Nicaragua':   { simbolo: 'C$',  codigo: 'NIO' },
  'Panamá':      { simbolo: 'B/.', codigo: 'PAB' },
}

const MIN_FOTOS = 3
const MAX_FOTOS = 10
const MAX_FOTOS_EDIFICIO = 10
const BUCKET = 'propiedades-fotos'

const AMENIDADES_LIST = [
  'Parqueo de visitas',
  'Gimnasio',
  'Jardín',
  'Área social',
  'Pet garden',
  'Piscina',
  'Otro',
]

type FormData = {
  titulo: string
  tipo: string
  pais: string
  departamento: string
  municipio: string
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
  mostrar_mapa: boolean
}

type FotoLocal = {
  file: File
  previewUrl: string
}

const initialForm: FormData = {
  titulo: '',
  tipo: 'Apartamento',
  pais: 'Guatemala',
  departamento: '',
  municipio: '',
  zona: '',
  precio_quetzales: '',
  incluye_iva: false,
  incluye_mantenimiento: false,
  habitaciones: '',
  banos: '',
  tiene_parqueo: false,
  cantidad_parqueos: '',
  amueblado: false,
  metraje_sin_parqueo: '',
  metraje_con_parqueo: '',
  descripcion: '',
  estado: 'disponible',
  mostrar_mapa: false,
}

export default function NuevaPropiedad() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const inputFileRef    = useRef<HTMLInputElement>(null)
  const inputEdificioRef = useRef<HTMLInputElement>(null)

  const [form, setForm]                     = useState<FormData>(initialForm)
  const [fotos, setFotos]                   = useState<FotoLocal[]>([])
  const [fotosEdificio, setFotosEdificio]   = useState<FotoLocal[]>([])
  const [enCondominio, setEnCondominio]     = useState(false)
  const [amenidades, setAmenidades]         = useState<string[]>([])
  const [amenidadOtro, setAmenidadOtro]     = useState('')
  const [enviando, setEnviando]             = useState(false)
  const [progreso, setProgreso]             = useState<{ actual: number; total: number } | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [tipoCambio, setTipoCambio]         = useState<number>(7.75)

  const precioDolares = form.precio_quetzales && tipoCambio > 0
    ? (parseFloat(form.precio_quetzales) / tipoCambio).toFixed(2)
    : ''

  const mostrarInfoEdificio = form.tipo === 'Apartamento' || (form.tipo === 'Casa' && enCondominio)
  const seccionLabel = form.tipo === 'Apartamento' ? 'Información del edificio' : 'Información del condominio/residencial'

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    },
    []
  )

  const toggleAmenidad = (amenidad: string) => {
    setAmenidades(prev =>
      prev.includes(amenidad) ? prev.filter(a => a !== amenidad) : [...prev, amenidad]
    )
  }

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? [])
    if (!archivos.length) return
    const nuevas: FotoLocal[] = archivos.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    setFotos(prev => [...prev, ...nuevas].slice(0, MAX_FOTOS))
    e.target.value = ''
  }

  const quitarFoto = (index: number) => {
    setFotos(prev => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSeleccionarEdificio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? [])
    if (!archivos.length) return
    const nuevas: FotoLocal[] = archivos.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    setFotosEdificio(prev => [...prev, ...nuevas].slice(0, MAX_FOTOS_EDIFICIO))
    e.target.value = ''
  }

  const quitarFotoEdificio = (index: number) => {
    setFotosEdificio(prev => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.pais) {
      setError('El campo País es obligatorio.')
      return
    }
    if (form.pais === 'Guatemala' && !form.departamento) {
      setError('El campo Departamento es obligatorio.')
      return
    }
    if (fotos.length < MIN_FOTOS) {
      setError(`Debés seleccionar al menos ${MIN_FOTOS} fotos del apartamento.`)
      return
    }

    setEnviando(true)
    const totalFotos = fotos.length + (mostrarInfoEdificio ? fotosEdificio.length : 0)
    setProgreso({ actual: 0, total: totalFotos })

    const userId = usuario?.id ?? 'anonimo'
    const fotosUrls: string[] = []
    let fotosSubidas = 0

    // Subir fotos del apartamento
    for (let i = 0; i < fotos.length; i++) {
      const { file } = fotos[i]
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
      fotosSubidas++
      setProgreso({ actual: fotosSubidas, total: totalFotos })
    }

    // Subir fotos del edificio
    const fotosEdificioUrls: string[] = []
    if (mostrarInfoEdificio) {
      for (let i = 0; i < fotosEdificio.length; i++) {
        const { file } = fotosEdificio[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `edificio/${userId}/${Date.now()}_${i}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false })

        if (uploadError) {
          setError(`Error subiendo foto del edificio ${i + 1}: ${uploadError.message}`)
          setEnviando(false)
          setProgreso(null)
          return
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
        fotosEdificioUrls.push(urlData.publicUrl)
        fotosSubidas++
        setProgreso({ actual: fotosSubidas, total: totalFotos })
      }
    }

    // Construir array de amenidades final
    const amenidadesFinales = mostrarInfoEdificio
      ? amenidades.map(a => a === 'Otro' ? (amenidadOtro.trim() ? `Otro: ${amenidadOtro.trim()}` : 'Otro') : a)
      : []

    const { error: sbError } = await supabase.from('propiedades').insert({
      titulo: form.titulo,
      tipo: form.tipo,
      pais: form.pais,
      departamento: form.departamento || null,
      municipio: form.municipio || null,
      zona: form.zona || null,
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
      fotos: fotosUrls,
      estado: form.estado,
      mostrar_mapa: form.mostrar_mapa,
      publicado_por: usuario?.id ?? null,
      tiene_info_edificio: mostrarInfoEdificio,
      amenidades_edificio: amenidadesFinales,
      fotos_edificio: fotosEdificioUrls,
    })

    setEnviando(false)
    setProgreso(null)

    if (sbError) {
      setError(`Error al guardar: ${sbError.message}`)
      return
    }

    navigate('/propiedades')
  }

  const porcentaje = progreso ? Math.round((progreso.actual / progreso.total) * 100) : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1B3A5C' }}>Publicar propiedad</h1>
          <p className="mt-1 text-sm" style={{ color: '#666' }}>Completá el formulario para publicar tu propiedad en RentaloLatam</p>
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
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  required
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
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    required
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
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>País <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    name="pais"
                    value={form.pais}
                    onChange={e => {
                      const p = e.target.value
                      setForm(prev => ({ ...prev, pais: p, departamento: '', municipio: '', zona: '' }))
                      setTipoCambio(TIPO_CAMBIO_POR_PAIS[p] ?? 7.75)
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  >
                    {PAISES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Ubicación geográfica */}
              {form.pais === 'Guatemala' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>Departamento <span style={{ color: '#e53e3e' }}>*</span></label>
                      <select
                        value={form.departamento}
                        onChange={e => setForm(prev => ({ ...prev, departamento: e.target.value, municipio: '', zona: '' }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: '#CBD5E0' }}
                      >
                        <option value="">Seleccionar departamento</option>
                        {DEPARTAMENTOS_GUATEMALA.map(d => <option key={d.nombre}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>Municipio</label>
                      <select
                        value={form.municipio}
                        onChange={e => setForm(prev => ({ ...prev, municipio: e.target.value, zona: '' }))}
                        disabled={!form.departamento}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: '#CBD5E0', opacity: form.departamento ? 1 : 0.5 }}
                      >
                        <option value="">Seleccionar municipio</option>
                        {(DEPARTAMENTOS_GUATEMALA.find(d => d.nombre === form.departamento)?.municipios ?? []).map(m => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Zona: solo para Guatemala Ciudad */}
                  {form.departamento === 'Guatemala' && form.municipio === 'Guatemala' && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>Zona</label>
                      <select
                        value={form.zona}
                        onChange={e => setForm(prev => ({ ...prev, zona: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: '#CBD5E0' }}
                      >
                        <option value="">Seleccionar zona (opcional)</option>
                        {ZONAS_CIUDAD_GUATEMALA.map(z => <option key={z}>{z}</option>)}
                      </select>
                    </div>
                  )}
                  {/* Sector libre para otros municipios */}
                  {!(form.departamento === 'Guatemala' && form.municipio === 'Guatemala') && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>Sector / Colonia (opcional)</label>
                      <input
                        name="zona"
                        value={form.zona}
                        onChange={handleChange}
                        placeholder="Ej: Cayalá, Muxbal, Ciudad San Cristóbal..."
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: '#CBD5E0' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Ciudad o región <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    name="zona"
                    value={form.zona}
                    onChange={handleChange}
                    required
                    placeholder="Ej: San José, Zona Rosa, Santa Ana..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                  Estado <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#CBD5E0' }}
                >
                  <option value="disponible">Disponible</option>
                  <option value="arrendado">Arrendado</option>
                  <option value="en mantenimiento">En mantenimiento</option>
                </select>
              </div>

              {/* Toggle mapa */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg" style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4' }}>
                <input
                  type="checkbox"
                  name="mostrar_mapa"
                  checked={form.mostrar_mapa}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded"
                  style={{ accentColor: '#52B788' }}
                />
                <div>
                  <span className="text-sm font-semibold" style={{ color: '#2D6A4F' }}>Mostrar ubicación en el mapa</span>
                  <p className="text-xs mt-1" style={{ color: '#555' }}>
                    Las propiedades con mapa se alquilan un 30% más rápido y generan más confianza en los inquilinos.
                  </p>
                </div>
              </label>

              {/* Checkbox condominio — solo para Casa */}
              {form.tipo === 'Casa' && (
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg" style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4' }}>
                  <input
                    type="checkbox"
                    checked={enCondominio}
                    onChange={e => setEnCondominio(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded"
                    style={{ accentColor: '#52B788' }}
                  />
                  <span className="text-sm" style={{ color: '#2D6A4F', fontWeight: '500' }}>
                    Esta casa está en condominio o residencial privado
                  </span>
                </label>
              )}
            </div>
          </section>

          {/* Precio */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1B3A5C' }}>Precio</h2>
            <div className="space-y-4">

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Precio (moneda local) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    name="precio_quetzales"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_quetzales}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 4500"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Tipo de cambio (1 USD = ?)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={tipoCambio}
                    onChange={e => setTipoCambio(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#999' }}>
                    {MONEDA_POR_PAIS[form.pais]
                      ? `Tasa oficial sugerida: 1 USD = ${MONEDA_POR_PAIS[form.pais].simbolo}${tipoCambio} (${MONEDA_POR_PAIS[form.pais].codigo}). Ajustá según tu negociación.`
                      : 'Tasa oficial sugerida para la moneda local. Ajustá según tu negociación.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Precio en dólares (USD)
                  </label>
                  <input
                    type="text"
                    value={precioDolares ? `$${precioDolares}` : ''}
                    readOnly
                    placeholder="Calculado automáticamente"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: '#CBD5E0', backgroundColor: '#F8F9FA', color: '#666' }}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="incluye_iva"
                    checked={form.incluye_iva}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#52B788' }}
                  />
                  <span className="text-sm" style={{ color: '#333' }}>Precio incluye IVA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="incluye_mantenimiento"
                    checked={form.incluye_mantenimiento}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#52B788' }}
                  />
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
                  <input
                    name="habitaciones"
                    type="number"
                    min="0"
                    value={form.habitaciones}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 2"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Baños <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    name="banos"
                    type="number"
                    min="0"
                    value={form.banos}
                    onChange={handleChange}
                    required
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
                  <input
                    name="metraje_sin_parqueo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.metraje_sin_parqueo}
                    onChange={handleChange}
                    placeholder="Ej: 85"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                    Metraje con parqueo (m²)
                  </label>
                  <input
                    name="metraje_con_parqueo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.metraje_con_parqueo}
                    onChange={handleChange}
                    placeholder="Ej: 110"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                </div>
              </div>

              <div className="flex gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="amueblado"
                    checked={form.amueblado}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#52B788' }}
                  />
                  <span className="text-sm" style={{ color: '#333' }}>Amueblado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tiene_parqueo"
                    checked={form.tiene_parqueo}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#52B788' }}
                  />
                  <span className="text-sm" style={{ color: '#333' }}>Tiene parqueo</span>
                </label>

                {form.tiene_parqueo && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm" style={{ color: '#333' }}>Cantidad de parqueos:</label>
                    <input
                      name="cantidad_parqueos"
                      type="number"
                      min="1"
                      value={form.cantidad_parqueos}
                      onChange={handleChange}
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
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={5}
              placeholder="Describí tu propiedad: amenidades, ubicación, características especiales..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ borderColor: '#CBD5E0' }}
            />
          </section>

          {/* Fotos del apartamento */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#1B3A5C' }}>Fotos</h2>
            <p className="text-xs mb-5" style={{ color: '#666' }}>
              Seleccioná entre {MIN_FOTOS} y {MAX_FOTOS} fotos desde tu computadora. Se subirán a Supabase Storage al publicar.
            </p>

            {fotos.length < MAX_FOTOS && (
              <>
                <input
                  ref={inputFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSeleccionarArchivos}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => inputFileRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: '#CBD5E0', backgroundColor: '#FAFAFA', cursor: 'pointer', color: '#666' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#52B788')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E0')}
                >
                  <span style={{ fontSize: '32px' }}>📷</span>
                  <span className="text-sm font-medium">Hacé click para seleccionar fotos</span>
                  <span className="text-xs" style={{ color: '#999' }}>
                    JPG, PNG, WEBP — {fotos.length}/{MAX_FOTOS} seleccionadas
                  </span>
                </button>
              </>
            )}

            {fotos.length > 0 && (
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {fotos.map((foto, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: '#E2E8F0' }}>
                    <img src={foto.previewUrl} alt={`preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: '999px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarFoto(i)}
                      style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(229,62,62,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', padding: '3px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {foto.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs" style={{ color: fotos.length < MIN_FOTOS ? '#e53e3e' : '#2D6A4F', fontWeight: '500' }}>
                {fotos.length < MIN_FOTOS
                  ? `Faltan ${MIN_FOTOS - fotos.length} foto${MIN_FOTOS - fotos.length !== 1 ? 's' : ''} más`
                  : `✓ ${fotos.length} foto${fotos.length !== 1 ? 's' : ''} lista${fotos.length !== 1 ? 's' : ''}`
                }
              </span>
              {fotos.length >= MAX_FOTOS && (
                <span className="text-xs" style={{ color: '#999' }}>Límite máximo alcanzado</span>
              )}
            </div>
          </section>

          {/* ── SECCIÓN EDIFICIO / CONDOMINIO (condicional) ── */}
          {mostrarInfoEdificio && (
            <section className="bg-white rounded-xl shadow-sm p-6" style={{ border: '2px solid #C6F6D5' }}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1B3A5C' }}>{seccionLabel}</h2>
                <p className="text-xs mt-1" style={{ color: '#666' }}>Esta sección es opcional. Podés completarla para dar más información a los inquilinos.</p>
              </div>

              {/* Amenidades */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: '#333' }}>
                  Amenidades del {form.tipo === 'Apartamento' ? 'edificio' : 'condominio/residencial'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENIDADES_LIST.map(amenidad => (
                    <label key={amenidad} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg" style={{ border: '1px solid', borderColor: amenidades.includes(amenidad) ? '#52B788' : '#E2E8F0', backgroundColor: amenidades.includes(amenidad) ? '#F0FFF4' : 'white' }}>
                      <input
                        type="checkbox"
                        checked={amenidades.includes(amenidad)}
                        onChange={() => toggleAmenidad(amenidad)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#52B788' }}
                      />
                      <span className="text-sm" style={{ color: '#333' }}>{amenidad}</span>
                    </label>
                  ))}
                </div>

                {amenidades.includes('Otro') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={amenidadOtro}
                      onChange={e => setAmenidadOtro(e.target.value)}
                      placeholder="Describí la amenidad adicional..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor: '#CBD5E0' }}
                    />
                  </div>
                )}
              </div>

              {/* Fotos del edificio */}
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#333' }}>Fotos del edificio</h3>
                <p className="text-xs mb-4" style={{ color: '#E53E3E', fontWeight: '500' }}>
                  Estas fotos son del edificio/áreas comunes, NO del apartamento
                </p>

                {fotosEdificio.length < MAX_FOTOS_EDIFICIO && (
                  <>
                    <input
                      ref={inputEdificioRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSeleccionarEdificio}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => inputEdificioRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
                      style={{ borderColor: '#CBD5E0', backgroundColor: '#FAFAFA', cursor: 'pointer', color: '#666' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#52B788')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E0')}
                    >
                      <span style={{ fontSize: '28px' }}>🏢</span>
                      <span className="text-sm font-medium">Agregar fotos del edificio (opcional)</span>
                      <span className="text-xs" style={{ color: '#999' }}>
                        JPG, PNG, WEBP — {fotosEdificio.length}/{MAX_FOTOS_EDIFICIO} seleccionadas
                      </span>
                    </button>
                  </>
                )}

                {fotosEdificio.length > 0 && (
                  <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {fotosEdificio.map((foto, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: '#E2E8F0' }}>
                        <img src={foto.previewUrl} alt={`edificio ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: '999px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => quitarFotoEdificio(i)}
                          style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(229,62,62,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', padding: '3px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {foto.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fotosEdificio.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: '#2D6A4F', fontWeight: '500' }}>
                    ✓ {fotosEdificio.length} foto{fotosEdificio.length !== 1 ? 's' : ''} del edificio
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Barra de progreso */}
          {progreso && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: '#555' }}>
                <span>Subiendo foto {progreso.actual} de {progreso.total}...</span>
                <span>{porcentaje}%</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: '#E2E8F0' }}>
                <div style={{ height: '100%', backgroundColor: '#52B788', width: `${porcentaje}%`, transition: 'width 0.3s ease', borderRadius: '999px' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: '#FFF5F5', color: '#c53030', border: '1px solid #FEB2B2' }}>
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-4 pb-10">
            <Link
              to="/propiedades"
              className="px-6 py-3 rounded-lg text-sm font-medium border"
              style={{ color: '#666', borderColor: '#CBD5E0', backgroundColor: 'white' }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={enviando || fotos.length < MIN_FOTOS}
              className="px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{
                backgroundColor: (enviando || fotos.length < MIN_FOTOS) ? '#A0AEC0' : '#52B788',
                cursor: (enviando || fotos.length < MIN_FOTOS) ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando ? `Subiendo fotos (${progreso?.actual ?? 0}/${progreso?.total ?? fotos.length})...` : 'Publicar propiedad'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
