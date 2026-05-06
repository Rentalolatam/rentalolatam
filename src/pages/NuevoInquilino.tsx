import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

type FormData = {
  nombre_completo: string
  email: string
  telefono: string
  fecha_nacimiento: string
  tipo_documento: 'DPI' | 'Pasaporte' | ''
  numero_documento: string
  nacionalidad: string
}

const initial: FormData = {
  nombre_completo: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  tipo_documento: '',
  numero_documento: '',
  nacionalidad: 'Guatemalteca',
}

export default function NuevoInquilino() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState<FormData>(initial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error: sbError } = await supabase.from('inquilinos').insert({
      propietario_id:         usuario!.id,
      nombre_completo:        form.nombre_completo.trim(),
      email:                  form.email.trim(),
      telefono:               form.telefono.trim() || null,
      fecha_nacimiento:       form.fecha_nacimiento || null,
      tipo_documento:         form.tipo_documento || null,
      numero_documento:       form.numero_documento.trim() || null,
      nacionalidad:           form.nacionalidad.trim(),
      invitado_por_propietario: true,
    })

    setGuardando(false)
    if (sbError) { setError(`Error al guardar: ${sbError.message}`); return }
    navigate('/inquilinos')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '14px 40px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          <Link to="/inquilinos" style={{ color: '#CBD5E0', textDecoration: 'none' }}>Inquilinos</Link>
          <span style={{ color: '#4A6FA5' }}>›</span>
          <span style={{ color: '#52B788' }}>Nuevo inquilino</span>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ color: '#1B3A5C', fontSize: '26px', fontWeight: 'bold', margin: '0 0 4px' }}>Agregar inquilino</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
          Completá los datos básicos. Después podés subir sus documentos desde el perfil.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Datos personales */}
          <Section titulo="Datos personales">
            <Field label="Nombre completo" required>
              <input name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required placeholder="Ej: María García López" style={inputStyle} />
            </Field>

            <TwoCol>
              <Field label="Email" required>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@ejemplo.com" style={inputStyle} />
              </Field>
              <Field label="Teléfono">
                <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="Ej: +502 1234-5678" style={inputStyle} />
              </Field>
            </TwoCol>

            <TwoCol>
              <Field label="Fecha de nacimiento">
                <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} style={inputStyle} />
              </Field>
              <Field label="Nacionalidad">
                <input name="nacionalidad" value={form.nacionalidad} onChange={handleChange} placeholder="Guatemalteca" style={inputStyle} />
              </Field>
            </TwoCol>
          </Section>

          {/* Documento */}
          <Section titulo="Documento de identidad">
            <TwoCol>
              <Field label="Tipo de documento">
                <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  <option value="DPI">DPI</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </Field>
              <Field label="Número de documento">
                <input name="numero_documento" value={form.numero_documento} onChange={handleChange} placeholder="Ej: 1234567890101" style={inputStyle} />
              </Field>
            </TwoCol>
          </Section>

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#c53030', borderRadius: '8px', padding: '12px 14px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
            <Link to="/inquilinos" style={{ padding: '10px 24px', borderRadius: '8px', border: '1.5px solid #CBD5E0', color: '#666', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              style={{ backgroundColor: guardando ? '#A0AEC0' : '#52B788', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}
            >
              {guardando ? 'Guardando...' : 'Guardar inquilino'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

/* ── helpers de layout ── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1.5px solid #CBD5E0', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', backgroundColor: 'white',
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <h2 style={{ color: '#1B3A5C', fontSize: '15px', fontWeight: 'bold', margin: '0 0 18px' }}>{titulo}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>{children}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px' }}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
