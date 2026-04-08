import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TIPO_CAMBIO = 7.75

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
  fotos: string[]
  estado: string
}

const initialForm: FormData = {
  titulo: '',
  tipo: 'Apartamento',
  pais: 'Guatemala',
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
  fotos: ['', '', ''],
  estado: 'disponible',
}

export default function NuevaPropiedad() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(initialForm)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const precioDolares =
    form.precio_quetzales
      ? (parseFloat(form.precio_quetzales) / TIPO_CAMBIO).toFixed(2)
      : ''

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    },
    []
  )

  const handleFotoChange = (index: number, value: string) => {
    setForm((prev) => {
      const fotos = [...prev.fotos]
      fotos[index] = value
      return { ...prev, fotos }
    })
  }

  const agregarFoto = () => {
    if (form.fotos.length < 10) {
      setForm((prev) => ({ ...prev, fotos: [...prev.fotos, ''] }))
    }
  }

  const quitarFoto = (index: number) => {
    if (form.fotos.length > 3) {
      setForm((prev) => {
        const fotos = prev.fotos.filter((_, i) => i !== index)
        return { ...prev, fotos }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const fotosValidas = form.fotos.filter((f) => f.trim() !== '')
    if (fotosValidas.length < 3) {
      setError('Debés ingresar al menos 3 URLs de fotos.')
      return
    }

    setEnviando(true)
    const { error: sbError } = await supabase.from('propiedades').insert({
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
      fotos: fotosValidas,
      estado: form.estado,
    })

    setEnviando(false)

    if (sbError) {
      setError(`Error al guardar: ${sbError.message}`)
      return
    }

    navigate('/propiedades')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      {/* NAVBAR */}
      <nav style={{ backgroundColor: '#1B3A5C', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/propiedades" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Propiedades</Link>
          <Link to="/propiedades/nueva" style={{ backgroundColor: '#52B788', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>Publicar propiedad</Link>
        </div>
      </nav>

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
                  <label className="block text-sm font-medium mb-1" style={{ color: '#333' }}>País</label>
                  <select
                    name="pais"
                    value={form.pais}
                    onChange={handleChange}
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
                  name="zona"
                  value={form.zona}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Zona 10, Zona 14, Cayalá..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#CBD5E0' }}
                />
              </div>

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
                  <p className="text-xs mt-1" style={{ color: '#999' }}>Tipo de cambio: Q7.75 = $1</p>
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

          {/* Fotos */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#1B3A5C' }}>Fotos</h2>
            <p className="text-xs mb-4" style={{ color: '#666' }}>
              Ingresá las URLs de las fotos de tu propiedad. Mínimo 3, máximo 10.
            </p>
            <div className="space-y-3">
              {form.fotos.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm w-6 text-right shrink-0" style={{ color: '#999' }}>{i + 1}.</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleFotoChange(i, e.target.value)}
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#CBD5E0' }}
                  />
                  {form.fotos.length > 3 && (
                    <button
                      type="button"
                      onClick={() => quitarFoto(i)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: '#e53e3e', backgroundColor: '#FFF5F5' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.fotos.length < 10 && (
              <button
                type="button"
                onClick={agregarFoto}
                className="mt-3 text-sm font-medium"
                style={{ color: '#2D6A4F' }}
              >
                + Agregar otra foto
              </button>
            )}
          </section>

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
              disabled={enviando}
              className="px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: enviando ? '#A0AEC0' : '#52B788', cursor: enviando ? 'not-allowed' : 'pointer' }}
            >
              {enviando ? 'Publicando...' : 'Publicar propiedad'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
