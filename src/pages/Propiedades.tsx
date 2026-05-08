import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { DEPARTAMENTOS_GUATEMALA, ZONAS_CIUDAD_GUATEMALA, PAISES } from '../data/geografia'

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#F0FFF4', color: '#2D6A4F' },
  arrendado: { label: 'Arrendado', bg: '#FFF5F5', color: '#c53030' },
  'en mantenimiento': { label: 'En mantenimiento', bg: '#FFFBEB', color: '#92400E' },
}

const TIPOS_FILTRO = ['Todos', 'Apartamento', 'Casa', 'Estudio', 'Loft']
const AMENIDADES_FILTRO = ['Piscina', 'Gimnasio', 'Jardín', 'Área social', 'Pet garden', 'Seguridad 24h']

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1.5px solid #CBD5E0',
  fontSize: '13px',
  color: '#333',
  backgroundColor: 'white',
  outline: 'none',
}

const inputStyle: React.CSSProperties = { ...selectStyle }

export default function Propiedades() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false)

  // Filtros sincronizados con URL
  const [pais, setPais] = useState(searchParams.get('pais') || 'Guatemala')
  const [departamento, setDepartamento] = useState(searchParams.get('departamento') || '')
  const [municipio, setMunicipio] = useState(searchParams.get('municipio') || '')
  const [zona, setZona] = useState(searchParams.get('zona') || '')
  const [ciudadLibre, setCiudadLibre] = useState(searchParams.get('ciudad') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || 'Todos')
  const [precioMin, setPrecioMin] = useState(searchParams.get('precioMin') || '')
  const [precioMax, setPrecioMax] = useState(searchParams.get('precioMax') || '')
  const [habitaciones, setHabitaciones] = useState<string[]>(searchParams.get('habitaciones')?.split(',').filter(Boolean) || [])
  const [banos, setBanos] = useState<string[]>(searchParams.get('banos')?.split(',').filter(Boolean) || [])
  const [parqueos, setParqueos] = useState<string[]>(searchParams.get('parqueos')?.split(',').filter(Boolean) || [])
  const [amueblado, setAmueblado] = useState<'si' | 'no' | ''>(searchParams.get('amueblado') as 'si' | 'no' | '' || '')
  const [amenidades, setAmenidades] = useState<string[]>(searchParams.get('amenidades')?.split(',').filter(Boolean) || [])

  const esGuatemala = pais === 'Guatemala'
  const deptoSeleccionado = DEPARTAMENTOS_GUATEMALA.find(d => d.nombre === departamento)
  const municipiosDepto = deptoSeleccionado?.municipios ?? []
  const mostrarZona = esGuatemala && departamento === 'Guatemala' && municipio === 'Guatemala'

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  // Filtros activos para tags
  const filtrosActivos: { label: string; clear: () => void }[] = []
  if (departamento) filtrosActivos.push({ label: `Depto: ${departamento}`, clear: () => { setDepartamento(''); setMunicipio(''); setZona('') } })
  if (municipio) filtrosActivos.push({ label: `Mun: ${municipio}`, clear: () => { setMunicipio(''); setZona('') } })
  if (zona) filtrosActivos.push({ label: zona, clear: () => setZona('') })
  if (ciudadLibre) filtrosActivos.push({ label: ciudadLibre, clear: () => setCiudadLibre('') })
  if (tipo && tipo !== 'Todos') filtrosActivos.push({ label: `Tipo: ${tipo}`, clear: () => setTipo('Todos') })
  if (precioMin) filtrosActivos.push({ label: `Desde Q${parseInt(precioMin).toLocaleString()}`, clear: () => setPrecioMin('') })
  if (precioMax) filtrosActivos.push({ label: `Hasta Q${parseInt(precioMax).toLocaleString()}`, clear: () => setPrecioMax('') })
  habitaciones.forEach(h => filtrosActivos.push({ label: `${h} hab.`, clear: () => toggleArr(habitaciones, h, setHabitaciones) }))
  banos.forEach(b => filtrosActivos.push({ label: `${b} baño${b === '1' ? '' : 's'}`, clear: () => toggleArr(banos, b, setBanos) }))
  parqueos.forEach(p => filtrosActivos.push({ label: `${p} parqueo${p === '1' ? '' : 's'}`, clear: () => toggleArr(parqueos, p, setParqueos) }))
  if (amueblado === 'si') filtrosActivos.push({ label: 'Amueblado', clear: () => setAmueblado('') })
  if (amueblado === 'no') filtrosActivos.push({ label: 'Sin amueblar', clear: () => setAmueblado('') })
  amenidades.forEach(a => filtrosActivos.push({ label: a, clear: () => toggleArr(amenidades, a, setAmenidades) }))

  const limpiarFiltros = () => {
    setDepartamento(''); setMunicipio(''); setZona('')
    setCiudadLibre(''); setTipo('Todos'); setPrecioMin(''); setPrecioMax('')
    setHabitaciones([]); setBanos([]); setParqueos([]); setAmueblado(''); setAmenidades([])
  }

  const aplicarFiltros = useCallback(async (overrides?: {
    pais?: string; departamento?: string; municipio?: string; zona?: string;
    ciudadLibre?: string; tipo?: string; precioMin?: string; precioMax?: string;
    habitaciones?: string[]; banos?: string[]; parqueos?: string[];
    amueblado?: 'si' | 'no' | ''; amenidades?: string[]
  }) => {
    const _pais = overrides?.pais ?? pais
    const _dept = overrides?.departamento ?? departamento
    const _mun = overrides?.municipio ?? municipio
    const _zona = overrides?.zona ?? zona
    const _ciudad = overrides?.ciudadLibre ?? ciudadLibre
    const _tipo = overrides?.tipo ?? tipo
    const _pMin = overrides?.precioMin ?? precioMin
    const _pMax = overrides?.precioMax ?? precioMax
    const _hab = overrides?.habitaciones ?? habitaciones
    const _ban = overrides?.banos ?? banos
    const _parq = overrides?.parqueos ?? parqueos
    const _amue = overrides?.amueblado ?? amueblado
    const _amen = overrides?.amenidades ?? amenidades
    const _esGT = _pais === 'Guatemala'

    setCargando(true)
    setError(null)

    // Sync URL
    const params = new URLSearchParams()
    if (_pais) params.set('pais', _pais)
    if (_esGT) {
      if (_dept) params.set('departamento', _dept)
      if (_mun) params.set('municipio', _mun)
      if (_zona) params.set('zona', _zona)
    } else {
      if (_ciudad) params.set('ciudad', _ciudad)
    }
    if (_tipo && _tipo !== 'Todos') params.set('tipo', _tipo)
    if (_pMin) params.set('precioMin', _pMin)
    if (_pMax) params.set('precioMax', _pMax)
    if (_hab.length) params.set('habitaciones', _hab.join(','))
    if (_ban.length) params.set('banos', _ban.join(','))
    if (_parq.length) params.set('parqueos', _parq.join(','))
    if (_amue) params.set('amueblado', _amue)
    if (_amen.length) params.set('amenidades', _amen.join(','))
    setSearchParams(params, { replace: true })

    let query = supabase
      .from('propiedades')
      .select('*')
      .or('estado_publicacion.eq.activa,estado_publicacion.is.null')
      .order('created_at', { ascending: false })

    if (_pais) query = query.eq('pais', _pais)
    if (_esGT && _dept) query = query.eq('departamento', _dept)
    if (_esGT && _mun) query = query.eq('municipio', _mun)
    if (_esGT && _zona) query = query.eq('zona', _zona)
    if (!_esGT && _ciudad) query = query.ilike('zona', `%${_ciudad}%`)
    if (_tipo && _tipo !== 'Todos') query = query.eq('tipo', _tipo)
    if (_pMin) query = query.gte('precio_quetzales', parseFloat(_pMin))
    if (_pMax) query = query.lte('precio_quetzales', parseFloat(_pMax))
    if (_amue === 'si') query = query.eq('amueblado', true)
    if (_amue === 'no') query = query.eq('amueblado', false)

    if (_hab.length) {
      const parts = _hab.map(h => h === '5+' ? 'habitaciones.gte.5' : `habitaciones.eq.${h}`)
      query = query.or(parts.join(','))
    }
    if (_ban.length) {
      const parts = _ban.map(b => b === '4+' ? 'banos.gte.4' : `banos.eq.${b}`)
      query = query.or(parts.join(','))
    }
    if (_parq.length) {
      const parts = _parq.map(p => p === '0' ? 'tiene_parqueo.eq.false' : p === '3+' ? 'cantidad_parqueos.gte.3' : `cantidad_parqueos.eq.${p}`)
      query = query.or(parts.join(','))
    }

    const { data, error: sbError } = await query

    if (sbError) {
      setError(sbError.message)
      setCargando(false)
      return
    }

    let resultados = (data as Propiedad[]) ?? []

    if (_amen.length) {
      resultados = resultados.filter(p => {
        if (!p.amenidades_edificio) return false
        return _amen.every(a => p.amenidades_edificio!.some(ae => ae.toLowerCase().includes(a.toLowerCase())))
      })
    }

    setPropiedades(resultados)
    setCargando(false)
  }, [pais, departamento, municipio, zona, ciudadLibre, tipo, precioMin, precioMax, habitaciones, banos, parqueos, amueblado, amenidades, setSearchParams])

  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const btnToggle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: `1.5px solid ${active ? '#52B788' : '#CBD5E0'}`,
    backgroundColor: active ? '#F0FFF4' : 'white',
    color: active ? '#2D6A4F' : '#555',
    fontWeight: active ? '700' : '500',
    fontSize: '12px',
    cursor: 'pointer',
  })

  const handleClearFilter = (clearFn: () => void) => {
    clearFn()
    // Use a timeout so state is updated before re-querying
    setTimeout(() => aplicarFiltros(), 50)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER + FILTROS */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '40px 40px 28px' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Propiedades</h1>
        <p style={{ color: '#CBD5E0', fontSize: '15px', marginBottom: '20px' }}>Explorá todas las propiedades disponibles</p>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '16px 20px' }}>

          {/* Fila principal */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>País</label>
              <select value={pais} onChange={e => { setPais(e.target.value); setDepartamento(''); setMunicipio(''); setZona('') }} style={selectStyle}>
                {PAISES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {esGuatemala ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>Departamento</label>
                  <select value={departamento} onChange={e => { setDepartamento(e.target.value); setMunicipio(''); setZona('') }} style={selectStyle}>
                    <option value="">Todos</option>
                    {DEPARTAMENTOS_GUATEMALA.map(d => <option key={d.nombre}>{d.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>Municipio</label>
                  <select value={municipio} onChange={e => { setMunicipio(e.target.value); setZona('') }} disabled={!departamento} style={{ ...selectStyle, opacity: departamento ? 1 : 0.5 }}>
                    <option value="">Todos</option>
                    {municipiosDepto.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>Ciudad o región</label>
                <input type="text" value={ciudadLibre} onChange={e => setCiudadLibre(e.target.value)} placeholder="Ej: San José..." style={inputStyle} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={selectStyle}>
                {TIPOS_FILTRO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <button onClick={() => aplicarFiltros()} style={{ backgroundColor: '#52B788', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Buscar
            </button>
          </div>

          {/* Zona (Guatemala Ciudad) */}
          {mostrarZona && (
            <div style={{ marginTop: '10px', maxWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase' }}>Zona</label>
              <select value={zona} onChange={e => setZona(e.target.value)} style={selectStyle}>
                <option value="">Todas las zonas</option>
                {ZONAS_CIUDAD_GUATEMALA.map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
          )}

          {/* Toggle avanzados */}
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => setFiltrosExpandidos(!filtrosExpandidos)} style={{ background: 'none', border: 'none', color: '#A7F3D0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
              {filtrosExpandidos ? '▾ Ocultar filtros avanzados' : '▸ + Filtros avanzados'}
            </button>
          </div>

          {/* Filtros avanzados */}
          {filtrosExpandidos && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Precio (Q)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="number" placeholder="Mínimo" value={precioMin} onChange={e => setPrecioMin(e.target.value)} min={0} style={{ ...inputStyle, width: '120px' }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>—</span>
                  <input type="number" placeholder="Máximo" value={precioMax} onChange={e => setPrecioMax(e.target.value)} min={0} style={{ ...inputStyle, width: '120px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Habitaciones</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {['1', '2', '3', '4', '5+'].map(v => (
                      <button key={v} onClick={() => toggleArr(habitaciones, v, setHabitaciones)} style={btnToggle(habitaciones.includes(v))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Baños</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {['1', '2', '3', '4+'].map(v => (
                      <button key={v} onClick={() => toggleArr(banos, v, setBanos)} style={btnToggle(banos.includes(v))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Parqueos</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {['0', '1', '2', '3+'].map(v => (
                      <button key={v} onClick={() => toggleArr(parqueos, v, setParqueos)} style={btnToggle(parqueos.includes(v))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Amueblado</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {(['si', 'no', ''] as const).map(v => (
                      <button key={v || 'ind'} onClick={() => setAmueblado(amueblado === v ? '' : v)} style={btnToggle(amueblado === v)}>
                        {v === 'si' ? 'Sí' : v === 'no' ? 'No' : 'Indiferente'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>Amenidades</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {AMENIDADES_FILTRO.map(a => (
                    <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', border: `1.5px solid ${amenidades.includes(a) ? '#52B788' : '#CBD5E0'}`, backgroundColor: amenidades.includes(a) ? '#F0FFF4' : 'white', fontSize: '12px', color: amenidades.includes(a) ? '#2D6A4F' : '#555' }}>
                      <input type="checkbox" checked={amenidades.includes(a)} onChange={() => toggleArr(amenidades, a, setAmenidades)} style={{ accentColor: '#52B788', width: '13px', height: '13px' }} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Tags filtros activos */}
        {filtrosActivos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Filtros:</span>
            {filtrosActivos.map((f, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#EBF8FF', color: '#2B6CB0', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: '600' }}>
                {f.label}
                <button onClick={() => handleClearFilter(f.clear)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2B6CB0', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            ))}
            <button onClick={() => { limpiarFiltros(); setTimeout(() => aplicarFiltros(), 50) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c53030', fontSize: '12px', fontWeight: '600', padding: '4px 8px' }}>
              Limpiar filtros
            </button>
          </div>
        )}

        {cargando && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#52B788', borderTopColor: 'transparent' }} />
            <p className="mt-4 text-sm" style={{ color: '#666' }}>Cargando propiedades...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg p-4 text-sm mb-6" style={{ backgroundColor: '#FFF5F5', color: '#c53030', border: '1px solid #FEB2B2' }}>
            Error al cargar propiedades: {error}
          </div>
        )}

        {!cargando && !error && propiedades.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1B3A5C' }}>No se encontraron propiedades</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>Intentá con otros filtros o limpiá la búsqueda</p>
            {filtrosActivos.length > 0 && (
              <button onClick={() => { limpiarFiltros(); setTimeout(() => aplicarFiltros(), 50) }} className="inline-block px-8 py-3 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: '#52B788', border: 'none', cursor: 'pointer' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!cargando && propiedades.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm" style={{ color: '#666' }}>
                {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} encontrada{propiedades.length !== 1 ? 's' : ''}
              </p>
              <Link to="/propiedades/nueva" className="px-5 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: '#52B788' }}>
                + Publicar propiedad
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
              {propiedades.map((p) => (
                <PropiedadCard key={p.id} propiedad={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PropiedadCard({ propiedad: p }: { propiedad: Propiedad }) {
  const navigate = useNavigate()
  const badge = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE['disponible']
  const fotoUrl = p.fotos?.[0]

  const ubicacion = [p.municipio, p.departamento, p.pais].filter(Boolean).join(', ')
    || `${p.zona}, ${p.pais}`

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onClick={() => navigate(`/propiedades/${p.id}`)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      <div className="relative" style={{ height: '200px', backgroundColor: '#CBD5E0' }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt={p.titulo} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: '#999', fontSize: '14px' }}>Sin foto</div>
        )}
        <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1B3A5C', color: 'white', pointerEvents: 'none' }}>{p.tipo}</span>
        <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: badge.bg, color: badge.color, pointerEvents: 'none' }}>{badge.label}</span>
      </div>

      <div className="p-5">
        <p className="text-xs font-bold mb-1" style={{ color: '#52B788' }}>{ubicacion}</p>
        <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: '#1B3A5C' }}>{p.titulo}</h3>

        <div className="flex flex-wrap gap-3 mb-4 text-xs" style={{ color: '#666' }}>
          <span>🛏 {p.habitaciones} hab.</span>
          <span>🚿 {p.banos} baño{p.banos !== 1 ? 's' : ''}</span>
          {p.tiene_parqueo && <span>🚗 {p.cantidad_parqueos ?? 1} parqueo{(p.cantidad_parqueos ?? 1) !== 1 ? 's' : ''}</span>}
          {p.amueblado && <span>🛋 Amueblado</span>}
          {p.metraje_sin_parqueo && <span>📐 {p.metraje_sin_parqueo} m²</span>}
        </div>

        {(p.incluye_iva || p.incluye_mantenimiento) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {p.incluye_iva && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>IVA incluido</span>}
            {p.incluye_mantenimiento && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>Mant. incluido</span>}
          </div>
        )}

        <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
          <div>
            <div className="text-lg font-bold" style={{ color: '#1B3A5C' }}>Q{p.precio_quetzales.toLocaleString('es-GT')}/mes</div>
            <div className="text-xs" style={{ color: '#999' }}>≈ ${p.precio_dolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>Ver detalle →</span>
        </div>
      </div>
    </div>
  )
}
