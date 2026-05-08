import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEPARTAMENTOS_GUATEMALA, ZONAS_CIUDAD_GUATEMALA, PAISES } from '../data/geografia'

const TIPOS = ['Todos', 'Apartamento', 'Casa', 'Estudio', 'Loft']
const AMENIDADES_FILTRO = ['Piscina', 'Gimnasio', 'Jardín', 'Área social', 'Pet garden', 'Seguridad 24h']

const selectStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E0',
  fontSize: '14px',
  color: '#333',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
}

const inputStyle: React.CSSProperties = {
  ...selectStyle,
}

type Props = {
  dark?: boolean
}

export default function Buscador({ dark = true }: Props) {
  const navigate = useNavigate()

  const [pais, setPais] = useState('Guatemala')
  const [departamento, setDepartamento] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [zona, setZona] = useState('')
  const [ciudadLibre, setCiudadLibre] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [expandido, setExpandido] = useState(false)

  // Filtros avanzados
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [habitaciones, setHabitaciones] = useState<string[]>([])
  const [banos, setBanos] = useState<string[]>([])
  const [parqueos, setParqueos] = useState<string[]>([])
  const [amueblado, setAmueblado] = useState<'si' | 'no' | ''>('')
  const [amenidades, setAmenidades] = useState<string[]>([])

  const esGuatemala = pais === 'Guatemala'
  const deptoSeleccionado = DEPARTAMENTOS_GUATEMALA.find(d => d.nombre === departamento)
  const municipios = deptoSeleccionado?.municipios ?? []
  const mostrarZona = esGuatemala && departamento === 'Guatemala' && municipio === 'Guatemala'

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const handleBuscar = () => {
    const params = new URLSearchParams()
    if (pais) params.set('pais', pais)
    if (esGuatemala) {
      if (departamento) params.set('departamento', departamento)
      if (municipio) params.set('municipio', municipio)
      if (zona) params.set('zona', zona)
    } else {
      if (ciudadLibre.trim()) params.set('ciudad', ciudadLibre.trim())
    }
    if (tipo && tipo !== 'Todos') params.set('tipo', tipo)
    if (precioMin) params.set('precioMin', precioMin)
    if (precioMax) params.set('precioMax', precioMax)
    if (habitaciones.length) params.set('habitaciones', habitaciones.join(','))
    if (banos.length) params.set('banos', banos.join(','))
    if (parqueos.length) params.set('parqueos', parqueos.join(','))
    if (amueblado) params.set('amueblado', amueblado)
    if (amenidades.length) params.set('amenidades', amenidades.join(','))
    navigate(`/propiedades?${params.toString()}`)
  }

  const btnToggle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: '6px',
    border: `1.5px solid ${active ? '#52B788' : '#CBD5E0'}`,
    backgroundColor: active ? '#F0FFF4' : 'white',
    color: active ? '#2D6A4F' : '#555',
    fontWeight: active ? '700' : '500',
    fontSize: '13px',
    cursor: 'pointer',
  })

  const containerBg = dark ? 'rgba(255,255,255,0.12)' : 'white'
  const containerBorder = dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0'
  const labelColor = dark ? 'rgba(255,255,255,0.85)' : '#555'
  const advLabelColor = dark ? 'rgba(255,255,255,0.7)' : '#444'

  return (
    <div style={{ backgroundColor: containerBg, border: containerBorder, borderRadius: '16px', padding: '20px 24px', backdropFilter: 'blur(4px)', maxWidth: '900px', width: '100%' }}>

      {/* Fila principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>

        {/* País */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>País</label>
          <select
            value={pais}
            onChange={e => { setPais(e.target.value); setDepartamento(''); setMunicipio(''); setZona(''); setCiudadLibre('') }}
            style={selectStyle}
          >
            {PAISES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Ubicación */}
        {esGuatemala ? (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Departamento</label>
              <select
                value={departamento}
                onChange={e => { setDepartamento(e.target.value); setMunicipio(''); setZona('') }}
                style={selectStyle}
              >
                <option value="">Todos</option>
                {DEPARTAMENTOS_GUATEMALA.map(d => <option key={d.nombre}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Municipio</label>
              <select
                value={municipio}
                onChange={e => { setMunicipio(e.target.value); setZona('') }}
                disabled={!departamento}
                style={{ ...selectStyle, opacity: departamento ? 1 : 0.5 }}
              >
                <option value="">Todos</option>
                {municipios.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ciudad o región</label>
            <input
              type="text"
              value={ciudadLibre}
              onChange={e => setCiudadLibre(e.target.value)}
              placeholder="Ej: San José, Tegucigalpa..."
              style={inputStyle}
            />
          </div>
        )}

        {/* Tipo */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={selectStyle}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Buscar */}
        <button
          onClick={handleBuscar}
          style={{ backgroundColor: '#52B788', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Buscar
        </button>
      </div>

      {/* Zona (fila extra si aplica) */}
      {mostrarZona && (
        <div style={{ marginTop: '10px', maxWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: labelColor, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zona</label>
          <select value={zona} onChange={e => setZona(e.target.value)} style={selectStyle}>
            <option value="">Todas las zonas</option>
            {ZONAS_CIUDAD_GUATEMALA.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
      )}

      {/* Toggle filtros avanzados */}
      <div style={{ marginTop: '14px' }}>
        <button
          onClick={() => setExpandido(!expandido)}
          style={{ background: 'none', border: 'none', color: dark ? '#A7F3D0' : '#2D6A4F', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
        >
          {expandido ? '▾ Ocultar filtros avanzados' : '▸ + Filtros avanzados'}
        </button>
      </div>

      {/* Filtros avanzados */}
      {expandido && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Precio */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rango de precio (Q)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Mínimo"
                value={precioMin}
                onChange={e => setPrecioMin(e.target.value)}
                min={0}
                max={50000}
                style={{ ...inputStyle, width: '130px' }}
              />
              <span style={{ color: advLabelColor, fontSize: '13px' }}>—</span>
              <input
                type="number"
                placeholder="Máximo"
                value={precioMax}
                onChange={e => setPrecioMax(e.target.value)}
                min={0}
                max={50000}
                style={{ ...inputStyle, width: '130px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>

            {/* Habitaciones */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Habitaciones</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['1', '2', '3', '4', '5+'].map(v => (
                  <button key={v} onClick={() => toggleArr(habitaciones, v, setHabitaciones)} style={btnToggle(habitaciones.includes(v))}>{v}</button>
                ))}
              </div>
            </div>

            {/* Baños */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Baños</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['1', '2', '3', '4+'].map(v => (
                  <button key={v} onClick={() => toggleArr(banos, v, setBanos)} style={btnToggle(banos.includes(v))}>{v}</button>
                ))}
              </div>
            </div>

            {/* Parqueos */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Parqueos</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['0', '1', '2', '3+'].map(v => (
                  <button key={v} onClick={() => toggleArr(parqueos, v, setParqueos)} style={btnToggle(parqueos.includes(v))}>{v}</button>
                ))}
              </div>
            </div>

            {/* Amueblado */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amueblado</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['si', 'no', ''] as const).map(v => (
                  <button key={v || 'ind'} onClick={() => setAmueblado(v)} style={btnToggle(amueblado === v)}>
                    {v === 'si' ? 'Sí' : v === 'no' ? 'No' : 'Indiferente'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenidades */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: advLabelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amenidades</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AMENIDADES_FILTRO.map(a => (
                <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', border: `1.5px solid ${amenidades.includes(a) ? '#52B788' : '#CBD5E0'}`, backgroundColor: amenidades.includes(a) ? '#F0FFF4' : 'white', fontSize: '13px', color: amenidades.includes(a) ? '#2D6A4F' : '#555' }}>
                  <input
                    type="checkbox"
                    checked={amenidades.includes(a)}
                    onChange={() => toggleArr(amenidades, a, setAmenidades)}
                    style={{ accentColor: '#52B788', width: '14px', height: '14px' }}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
