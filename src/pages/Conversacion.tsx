import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Conversacion, type Mensaje } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

type ConversacionConPropiedad = Conversacion & {
  propiedades: { titulo: string; zona: string } | null
}

export default function ConversacionPage() {
  const { solicitudId }   = useParams<{ solicitudId: string }>()
  const { usuario: user } = useAuth()
  const navigate          = useNavigate()

  const [conv, setConv]         = useState<ConversacionConPropiedad | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto]       = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const listRef   = useRef<HTMLDivElement | null>(null)
  const inputRef  = useRef<HTMLTextAreaElement | null>(null)

  // Load or create conversation by solicitud_id
  useEffect(() => {
    if (!solicitudId || !user) return
    const init = async () => {
      setCargando(true)

      // Try to find existing conversation
      let { data: cData } = await supabase
        .from('conversaciones')
        .select('*, propiedades(titulo, zona)')
        .eq('solicitud_id', solicitudId)
        .maybeSingle()

      if (!cData) {
        // Create conversation from solicitud data
        const { data: sol } = await supabase
          .from('solicitudes_arriendo')
          .select('propiedad_id, propietario_id, inquilino_id')
          .eq('id', solicitudId)
          .single()

        if (!sol) { setError('Solicitud no encontrada.'); setCargando(false); return }

        const { data: newConv, error: createErr } = await supabase
          .from('conversaciones')
          .insert({
            solicitud_id:   solicitudId,
            propiedad_id:   sol.propiedad_id,
            propietario_id: sol.propietario_id,
            inquilino_id:   sol.inquilino_id,
          })
          .select('*, propiedades(titulo, zona)')
          .single()

        if (createErr) { setError('Error iniciando conversación.'); setCargando(false); return }
        cData = newConv
      }

      setConv(cData as ConversacionConPropiedad)

      // Load messages
      const { data: mData } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', cData.id)
        .order('created_at', { ascending: true })
      setMensajes((mData as Mensaje[]) ?? [])

      setCargando(false)
    }
    init()
  }, [solicitudId, user])

  // Real-time subscription
  useEffect(() => {
    if (!conv) return
    const channel = supabase
      .channel(`mensajes-${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${conv.id}` },
        (payload) => {
          const msg = payload.new as Mensaje
          setMensajes((prev) => {
            // Avoid duplicates (message may already be in state from optimistic update)
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conv])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [mensajes])

  const handleEnviar = async () => {
    if (!texto.trim() || !conv || !user || enviando) return
    const contenido = texto.trim()
    setTexto('')
    setEnviando(true)

    const { error: err } = await supabase.from('mensajes').insert({
      conversacion_id: conv.id,
      sender_id:       user.id,
      sender_nombre:   user.nombre,
      contenido,
    })

    if (err) {
      setError(`Error enviando mensaje: ${err.message}`)
      setTexto(contenido)
    }
    setEnviando(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const formatHora = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  // Group messages by date
  const mensajesPorFecha = mensajes.reduce<Record<string, Mensaje[]>>((acc, m) => {
    const key = new Date(m.created_at).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  if (!user) return null

  if (cargando) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '4px solid #52B788', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '14px', color: '#666', fontSize: '14px' }}>Cargando conversación...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (error || !conv) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <p style={{ color: '#666' }}>{error ?? 'Conversación no encontrada.'}</p>
        <button onClick={() => navigate(-1)} style={{ backgroundColor: '#1B3A5C', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>
          Volver
        </button>
      </div>
    </div>
  )

  const isLandlord = user.id === conv.propietario_id

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* HEADER */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => navigate(isLandlord ? `/inquilinos/${solicitudId}` : '/mi-arriendo')}
          style={{ background: 'none', border: 'none', color: '#CBD5E0', cursor: 'pointer', fontSize: '20px', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: 0 }}>
            {conv.propiedades?.titulo ?? 'Conversación'}
          </h1>
          {conv.propiedades?.zona && (
            <p style={{ color: '#CBD5E0', fontSize: '13px', margin: 0 }}>📍 {conv.propiedades.zona}</p>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ backgroundColor: '#14B8A6', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '999px' }}>
            Chat pre-aprobación
          </span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '24px',
          maxWidth: '720px', width: '100%', margin: '0 auto',
          display: 'flex', flexDirection: 'column', gap: '4px',
          minHeight: '400px',
        }}
      >
        {mensajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p style={{ fontSize: '14px' }}>No hay mensajes aún. ¡Empezá la conversación!</p>
          </div>
        )}

        {Object.entries(mensajesPorFecha).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
              <span style={{ backgroundColor: '#E2E8F0', color: '#718096', fontSize: '11px', fontWeight: '600', padding: '3px 12px', borderRadius: '999px' }}>
                {formatFecha(msgs[0].created_at)}
              </span>
            </div>

            {msgs.map((m) => {
              const esPropio = m.sender_id === user.id
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: esPropio ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  {!esPropio && (
                    <span style={{ fontSize: '11px', color: '#999', marginBottom: '3px', paddingLeft: '4px' }}>
                      {m.sender_nombre}
                    </span>
                  )}
                  <div
                    style={{
                      maxWidth: '72%',
                      backgroundColor: esPropio ? '#1B3A5C' : 'white',
                      color: esPropio ? 'white' : '#333',
                      padding: '10px 14px',
                      borderRadius: esPropio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.contenido}
                  </div>
                  <span style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                    {formatHora(m.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid #E2E8F0', padding: '16px 24px', maxWidth: '720px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {error && (
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              border: '1.5px solid #CBD5E0', fontSize: '14px',
              outline: 'none', resize: 'none', fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleEnviar}
            disabled={!texto.trim() || enviando}
            style={{
              backgroundColor: (!texto.trim() || enviando) ? '#A0AEC0' : '#52B788',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 20px', fontSize: '14px', fontWeight: 'bold',
              cursor: (!texto.trim() || enviando) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </div>
        <p style={{ color: '#A0AEC0', fontSize: '11px', margin: '6px 0 0' }}>
          Esta conversación es visible solo para vos y la otra parte. Usala para coordinar antes de la aprobación.
        </p>
      </div>
    </div>
  )
}
