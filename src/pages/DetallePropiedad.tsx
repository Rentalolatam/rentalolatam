import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Propiedad } from '../lib/supabase'
import Navbar from '../components/Navbar'

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#F0FFF4', color: '#2D6A4F' },
  arrendado: { label: 'Arrendado', bg: '#FFF5F5', color: '#c53030' },
  'en mantenimiento': { label: 'En mantenimiento', bg: '#FFFBEB', color: '#92400E' },
}

export default function DetallePropiedad() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [contactoVisible, setContactoVisible] = useState(false)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      const { data, error: sbError } = await supabase
        .from('propiedades')
        .select('*')
        .eq('id', id)
        .single()
      if (sbError) {
        setError(sbError.message)
      } else {
        setPropiedad(data as Propiedad)
      }
      setCargando(false)
    }
    cargar()
  }, [id])

  const fotos = propiedad?.fotos?.filter(Boolean) ?? []
  const badge = propiedad ? (ESTADO_BADGE[propiedad.estado] ?? ESTADO_BADGE['disponible']) : null

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', border: '4px solid #52B788',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto',
            }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Cargando propiedad...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error || !propiedad) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🏚</div>
          <h2 style={{ color: '#1B3A5C', fontSize: '20px', fontWeight: 'bold' }}>Propiedad no encontrada</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>{error ?? 'No existe una propiedad con ese ID.'}</p>
          <button
            onClick={() => navigate('/propiedades')}
            style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}
          >
            Volver a propiedades
          </button>
        </div>
      </div>
    )
  }

  const p = propiedad

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '14px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          <button onClick={() => navigate('/propiedades')} style={{ background: 'none', border: 'none', color: '#CBD5E0', cursor: 'pointer', padding: 0, fontSize: '13px' }}>
            Propiedades
          </button>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: 'white' }}>{p.zona}</span>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: '#52B788' }}>{p.titulo}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* GALERÍA */}
        <div style={{ marginBottom: '32px' }}>
          {/* Foto principal */}
          <div style={{
            width: '100%', height: '480px', borderRadius: '16px', overflow: 'hidden',
            backgroundColor: '#CBD5E0', marginBottom: '12px', position: 'relative',
          }}>
            {fotos.length > 0 ? (
              <img
                src={fotos[fotoActiva]}
                alt={`${p.titulo} - foto ${fotoActiva + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#999' }}>
                <span style={{ fontSize: '48px' }}>📷</span>
                <span style={{ fontSize: '14px' }}>Sin fotos disponibles</span>
              </div>
            )}

            {/* Contador de fotos */}
            {fotos.length > 1 && (
              <div style={{
                position: 'absolute', bottom: '16px', right: '16px',
                backgroundColor: 'rgba(0,0,0,0.55)', color: 'white',
                borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 'bold',
              }}>
                {fotoActiva + 1} / {fotos.length}
              </div>
            )}

            {/* Flechas de navegación */}
            {fotos.length > 1 && (
              <>
                <button
                  onClick={() => setFotoActiva((i) => (i - 1 + fotos.length) % fotos.length)}
                  style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setFotoActiva((i) => (i + 1) % fotos.length)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {fotos.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {fotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setFotoActiva(i)}
                  style={{
                    flexShrink: 0, width: '88px', height: '64px', borderRadius: '8px', overflow: 'hidden',
                    border: `2px solid ${i === fotoActiva ? '#52B788' : 'transparent'}`,
                    padding: 0, cursor: 'pointer', backgroundColor: '#CBD5E0',
                    opacity: i === fotoActiva ? 1 : 0.65, transition: 'all 0.15s',
                  }}
                >
                  <img src={url} alt={`miniatura ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENIDO: info + panel lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>

          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Encabezado */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#1B3A5C', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '6px' }}>
                  {p.tipo}
                </span>
                {badge && (
                  <span style={{ backgroundColor: badge.bg, color: badge.color, fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '6px' }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <h1 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px' }}>{p.titulo}</h1>
              <p style={{ color: '#52B788', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>📍 {p.zona}, {p.pais}</p>
            </div>

            {/* Características */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h2 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Características</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { icon: '🛏', label: 'Habitaciones', val: `${p.habitaciones}` },
                  { icon: '🚿', label: 'Baños', val: `${p.banos}` },
                  { icon: '🚗', label: 'Parqueos', val: p.tiene_parqueo ? `${p.cantidad_parqueos ?? 1}` : 'No' },
                  { icon: '🛋', label: 'Amueblado', val: p.amueblado ? 'Sí' : 'No' },
                  { icon: '📐', label: 'Metraje', val: p.metraje_sin_parqueo ? `${p.metraje_sin_parqueo} m²` : '—' },
                  { icon: '📐', label: 'Con parqueo', val: p.metraje_con_parqueo ? `${p.metraje_con_parqueo} m²` : '—' },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B3A5C' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            {p.descripcion && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <h2 style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Descripción</h2>
                <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{p.descripcion}</p>
              </div>
            )}

            {/* Botón volver */}
            <div>
              <button
                onClick={() => navigate('/propiedades')}
                style={{ background: 'none', border: 'none', color: '#2D6A4F', fontSize: '14px', cursor: 'pointer', padding: 0, fontWeight: '500' }}
              >
                ← Volver a propiedades
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA — Panel de precio y contacto */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              {/* Precio */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#1B3A5C', fontSize: '30px', fontWeight: 'bold', lineHeight: 1 }}>
                  Q{p.precio_quetzales.toLocaleString('es-GT')}
                  <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666' }}>/mes</span>
                </div>
                <div style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>
                  ≈ ${p.precio_dolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/mes
                </div>
              </div>

              {/* Etiquetas de precio */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {p.incluye_iva && (
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>
                    IVA incluido
                  </span>
                )}
                {p.incluye_mantenimiento && (
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#F0FFF4', color: '#2D6A4F' }}>
                    Mantenimiento incluido
                  </span>
                )}
                {!p.incluye_iva && !p.incluye_mantenimiento && (
                  <span style={{ fontSize: '11px', color: '#999' }}>Precio base sin IVA ni mantenimiento</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '20px' }}>
                {/* Botón contactar */}
                {!contactoVisible ? (
                  <button
                    onClick={() => setContactoVisible(true)}
                    style={{
                      width: '100%', backgroundColor: '#52B788', color: 'white', border: 'none',
                      borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Contactar propietario
                  </button>
                ) : (
                  <div style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📬</div>
                    <p style={{ color: '#2D6A4F', fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px' }}>
                      Mensaje enviado
                    </p>
                    <p style={{ color: '#555', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                      El propietario recibirá tu consulta y te contactará a la brevedad.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/propiedades/nueva')}
                  style={{
                    width: '100%', backgroundColor: 'transparent', color: '#1B3A5C',
                    border: '1.5px solid #1B3A5C', borderRadius: '10px', padding: '12px',
                    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
                  }}
                >
                  ¿Tenés una propiedad? Publicala
                </button>
              </div>
            </div>

            {/* Datos rápidos */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Tipo', val: p.tipo },
                  { label: 'País', val: p.pais },
                  { label: 'Zona', val: p.zona },
                  { label: 'Estado', val: badge?.label ?? p.estado },
                  { label: 'Publicado', val: new Date(p.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#999' }}>{label}</span>
                    <span style={{ color: '#333', fontWeight: '500' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
