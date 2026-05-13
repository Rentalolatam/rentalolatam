import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const OFRECEMOS = [
  { icon: '📋', title: 'Contratos digitales con firma electrónica' },
  { icon: '💳', title: 'Pagos de renta con tarjeta de crédito y débito' },
  { icon: '🏠', title: 'Administración de inquilinos y propiedades' },
  { icon: '📍', title: 'Propiedades verificadas y con ubicación exacta' },
  { icon: '📸', title: 'Descripciones de propiedades correctas y actualizadas' },
  { icon: '💬', title: 'Comunicación directa y segura entre propietario, inquilino y administrador' },
  { icon: '🔔', title: 'Notificaciones y recordatorios automáticos' },
  { icon: '🌎', title: 'Diseñado para Centroamérica — todo en un mismo lugar' },
]

const FUNDADORES = ['Jorge Molina', 'Rodrigo Ortega', 'José González-Campo', 'Enrique Arriola', 'Ignacio Penagos']

export default function Nosotros() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, backgroundColor: '#F8F9FA' }}>
      <Navbar />

      {/* ── 1. HERO ── */}
      <section style={{ backgroundColor: '#1B3A5C', padding: '96px 40px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ color: '#14B8A6', fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Nuestra historia
          </p>
          <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '28px' }}>
            La plataforma inmobiliaria que<br />Centroamérica necesitaba
          </h1>
          <p style={{ color: '#CBD5E0', fontSize: '17px', lineHeight: '1.8', margin: 0 }}>
            Buscar una propiedad para rentar en Centroamérica siempre fue más difícil de lo que debería. Grupos de WhatsApp, publicaciones desactualizadas, fotos del edificio en lugar del apartamento, información incorrecta de la propiedad y del contacto, publicaciones que generan desconfianza, trámites de abogados tediosos, pagos únicamente en efectivo o transferencia bancaria — sin opción de usar tarjeta de crédito — y procesos lentos y tediosos. Nosotros lo vivimos de primera mano. Y decidimos resolverlo.
          </p>
        </div>
      </section>

      {/* Divider wave */}
      <div style={{ backgroundColor: '#1B3A5C', height: '32px', clipPath: 'ellipse(55% 100% at 50% 0%)' }} />

      {/* ── 2. NUESTRA HISTORIA ── */}
      <section style={{ backgroundColor: 'white', padding: '80px 40px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Nuestra historia</h2>
          <p style={{ color: '#444', fontSize: '16px', lineHeight: '1.85' }}>
            RentaLo Latam nació en Guatemala de la mano de cinco socios con experiencia en desarrollo inmobiliario, finanzas, inversiones y energía, unidos por una convicción: la región centroamericana merece una plataforma inmobiliaria moderna, confiable y diseñada para sus necesidades reales. Respaldados por{' '}
            <strong style={{ color: '#1B3A5C' }}>Inercia Capital Partners</strong>, construimos RentaLo Latam como la primera plataforma 100% dedicada al arrendamiento y alquiler de propiedades en Centroamérica — contratos digitales, pagos con tarjeta de crédito, administración de inquilinos y propiedades, comunicación directa entre propietarios e inquilinos, y cada paso del proceso en un mismo lugar.
          </p>
        </div>
      </section>

      {/* ── 3. LO QUE NOS MUEVE ── */}
      <section style={{ backgroundColor: '#F0FDFA', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ color: '#14B8A6', fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Lo que nos mueve
          </p>
          <h2 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Nuestra convicción</h2>
          <blockquote style={{ margin: 0, padding: '32px 40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderLeft: '4px solid #14B8A6' }}>
            <p style={{ color: '#333', fontSize: '18px', lineHeight: '1.75', fontStyle: 'italic', margin: 0 }}>
              "Creemos que arrendar una propiedad debe ser tan simple, seguro y transparente como comprar un pasaje de avión. Sin papeleo innecesario, sin intermediarios opacos, sin incertidumbre."
            </p>
          </blockquote>
        </div>
      </section>

      {/* ── 4. QUÉ OFRECEMOS ── */}
      <section style={{ backgroundColor: 'white', padding: '80px 40px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <p style={{ color: '#14B8A6', fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Plataforma completa</p>
            <h2 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold' }}>Qué ofrecemos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {OFRECEMOS.map(({ icon, title }) => (
              <div
                key={title}
                style={{
                  backgroundColor: '#F8FFFE',
                  border: '1.5px solid #CCFBF1',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span style={{ fontSize: '28px' }}>{icon}</span>
                <span style={{ color: '#1B3A5C', fontSize: '14px', fontWeight: '600', lineHeight: '1.4' }}>{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. EL EQUIPO ── */}
      <section style={{ backgroundColor: '#1B3A5C', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ color: '#14B8A6', fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Las personas detrás</p>
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '40px' }}>El equipo</h2>

          {/* Placeholder foto */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto 32px',
            aspectRatio: '3/2',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '48px', opacity: 0.4 }}>📷</span>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>Foto del equipo próximamente</p>
          </div>

          {/* Nombres */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 4px', marginBottom: '10px' }}>
            {FUNDADORES.map((nombre, i) => (
              <span key={nombre} style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>
                {nombre}{i < FUNDADORES.length - 1 && <span style={{ color: '#14B8A6', margin: '0 6px' }}>·</span>}
              </span>
            ))}
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Co-fundadores</p>
        </div>
      </section>

      {/* ── 6. DÓNDE ESTAMOS ── */}
      <section style={{ backgroundColor: '#F8F9FA', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#14B8A6', fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Presencia regional</p>
          <h2 style={{ color: '#1B3A5C', fontSize: '28px', fontWeight: 'bold', marginBottom: '36px' }}>Dónde estamos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '24px' }}>📍</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#1B3A5C', fontWeight: '700', fontSize: '15px', margin: 0 }}>Ciudad de Guatemala, Guatemala</p>
                <p style={{ color: '#666', fontSize: '13px', margin: '2px 0 0' }}>Sede principal</p>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '24px' }}>🌎</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#1B3A5C', fontWeight: '700', fontSize: '15px', margin: 0 }}>Expansión en curso</p>
                <p style={{ color: '#666', fontSize: '13px', margin: '2px 0 0' }}>El Salvador, Honduras, Costa Rica y Panamá</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CTA FINAL ── */}
      <section style={{ backgroundColor: '#0F2942', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: '30px', fontWeight: 'bold', marginBottom: '12px' }}>
            ¿Listo para empezar?
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '16px', marginBottom: '40px' }}>
            Tanto si buscás tu próximo hogar como si querés publicar tu propiedad, estamos aquí para hacerlo simple.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/propiedades/nueva"
              style={{
                backgroundColor: '#14B8A6',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Publicar mi propiedad
            </Link>
            <Link
              to="/propiedades"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 'bold',
                textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.35)',
                display: 'inline-block',
              }}
            >
              Buscar mi próximo hogar
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#1B3A5C', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Link to="/propiedades" style={{ color: '#CBD5E0', textDecoration: 'none', fontSize: '13px' }}>Propiedades</Link>
          <Link to="/nosotros" style={{ color: '#CBD5E0', textDecoration: 'none', fontSize: '13px' }}>Nosotros</Link>
          <a href="mailto:admin@rentalolatam.com" style={{ color: '#CBD5E0', textDecoration: 'none', fontSize: '13px' }}>Contacto</a>
        </div>
        <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>© 2026 RentaloLatam · Guatemala · admin@rentalolatam.com</p>
      </footer>
    </div>
  )
}
