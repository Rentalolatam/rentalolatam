import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#F0FFF4', color: '#2D6A4F' },
  arrendado: { label: 'Arrendado', bg: '#FFF5F5', color: '#c53030' },
  'en mantenimiento': { label: 'En mantenimiento', bg: '#FFFBEB', color: '#92400E' },
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('propiedades')
        .select('*')
        .order('created_at', { ascending: false })

      if (sbError) {
        setError(sbError.message)
      } else {
        setPropiedades((data as Propiedad[]) ?? [])
      }
      setCargando(false)
    }
    cargar()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 40px 40px' }}>
        <h1 className="text-3xl font-bold text-white mb-2">Propiedades</h1>
        <p style={{ color: '#CBD5E0', fontSize: '15px' }}>Explorá todas las propiedades disponibles en Guatemala</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Estados */}
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
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1B3A5C' }}>Aún no hay propiedades publicadas</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>Sé el primero en publicar tu propiedad en RentaloLatam</p>
            <Link
              to="/propiedades/nueva"
              className="inline-block px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: '#52B788' }}
            >
              Publicar propiedad
            </Link>
          </div>
        )}

        {!cargando && propiedades.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm" style={{ color: '#666' }}>
                {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} encontrada{propiedades.length !== 1 ? 's' : ''}
              </p>
              <Link
                to="/propiedades/nueva"
                className="px-5 py-2 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: '#52B788' }}
              >
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

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onClick={() => navigate(`/propiedades/${p.id}`)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      {/* Imagen */}
      <div className="relative" style={{ height: '200px', backgroundColor: '#CBD5E0' }}>
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={p.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: '#999', fontSize: '14px' }}>
            Sin foto
          </div>
        )}
        {/* Badge tipo */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded"
          style={{ backgroundColor: '#1B3A5C', color: 'white' }}
        >
          {p.tipo}
        </span>
        {/* Badge estado */}
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <p className="text-xs font-bold mb-1" style={{ color: '#52B788' }}>{p.zona}, {p.pais}</p>
        <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: '#1B3A5C' }}>{p.titulo}</h3>

        {/* Detalles */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs" style={{ color: '#666' }}>
          <span>🛏 {p.habitaciones} hab.</span>
          <span>🚿 {p.banos} baño{p.banos !== 1 ? 's' : ''}</span>
          {p.tiene_parqueo && <span>🚗 {p.cantidad_parqueos ?? 1} parqueo{(p.cantidad_parqueos ?? 1) !== 1 ? 's' : ''}</span>}
          {p.amueblado && <span>🛋 Amueblado</span>}
          {p.metraje_sin_parqueo && <span>📐 {p.metraje_sin_parqueo} m²</span>}
        </div>

        {/* Etiquetas precio */}
        {(p.incluye_iva || p.incluye_mantenimiento) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {p.incluye_iva && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>
                IVA incluido
              </span>
            )}
            {p.incluye_mantenimiento && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>
                Mant. incluido
              </span>
            )}
          </div>
        )}

        {/* Precio */}
        <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
          <div>
            <div className="text-lg font-bold" style={{ color: '#1B3A5C' }}>
              Q{p.precio_quetzales.toLocaleString('es-GT')}/mes
            </div>
            <div className="text-xs" style={{ color: '#999' }}>
              ≈ ${p.precio_dolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>
            Ver detalle →
          </span>
        </div>
      </div>
    </div>
  )
}
