import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Propiedades from './pages/Propiedades'
import NuevaPropiedad from './pages/NuevaPropiedad'
import DetallePropiedad from './pages/DetallePropiedad'
import Login from './pages/Login'
import Registro from './pages/Registro'

function LandingPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>

      {/* NAVBAR con links extra de la landing */}
      <nav style={{ backgroundColor: '#1B3A5C', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/propiedades" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Propiedades</Link>
          <a href="#propietarios" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Para propietarios</a>
          <a href="#footer" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Contacto</a>

          {usuario ? (
            <>
              <span style={{ color: 'white', fontSize: '14px' }}>{usuario.nombre}</span>
              <span style={{
                fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px',
                backgroundColor: usuario.tipo === 'Propietario' ? '#EBF8FF' : '#F0FFF4',
                color: usuario.tipo === 'Propietario' ? '#2B6CB0' : '#2D6A4F',
              }}>
                {usuario.tipo}
              </span>
              <button
                onClick={handleLogout}
                style={{ backgroundColor: 'transparent', color: '#CBD5E0', border: '1px solid #CBD5E0', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Iniciar sesión</Link>
              <Link to="/propiedades/nueva" style={{ backgroundColor: '#52B788', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                Publicar propiedad
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
          Encontrá tu próximo hogar<br />en Centroamérica
        </h1>
        <p style={{ color: '#CBD5E0', fontSize: '18px', marginBottom: '40px' }}>
          La plataforma de rentas más completa de la región. Propiedades verificadas, contratos digitales y pagos seguros.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <input
            placeholder="Zona, colonia o ciudad..."
            style={{ padding: '14px 20px', borderRadius: '8px', border: 'none', width: '320px', fontSize: '15px' }}
          />
          <select style={{ padding: '14px 20px', borderRadius: '8px', border: 'none', fontSize: '15px', color: '#666' }}>
            <option>Guatemala</option>
            <option>El Salvador</option>
            <option>Honduras</option>
            <option>Costa Rica</option>
            <option>Panamá</option>
          </select>
          <button
            style={{ backgroundColor: '#52B788', color: 'white', padding: '14px 32px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => window.location.href = '/propiedades'}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ backgroundColor: '#2D6A4F', padding: '32px 40px', display: 'flex', justifyContent: 'center', gap: '80px' }}>
        {[['500+', 'Propiedades activas'], ['5', 'Países'], ['100%', 'Contratos digitales'], ['24h', 'Soporte']].map(([num, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>{num}</div>
            <div style={{ color: '#A7F3D0', fontSize: '13px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* PROPIEDADES */}
      <div style={{ padding: '64px 40px', backgroundColor: '#F8F9FA' }}>
        <h2 style={{ textAlign: 'center', color: '#1B3A5C', fontSize: '32px', marginBottom: '8px' }}>Propiedades destacadas</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>Encontrá el espacio ideal para vos</p>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { zona: 'Zona 10, Guatemala', tipo: 'Apartamento moderno', precio: 'Q4,500/mes', hab: '2 hab · 2 baños · Parqueo' },
            { zona: 'Zona 14, Guatemala', tipo: 'Casa con jardín', precio: 'Q8,200/mes', hab: '3 hab · 3 baños · Jardín' },
            { zona: 'Zona 15, Guatemala', tipo: 'Estudio ejecutivo', precio: 'Q3,200/mes', hab: '1 hab · 1 baño · Amueblado' },
          ].map((p) => (
            <div key={p.zona} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', width: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: '#CBD5E0', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                📷 Foto de propiedad
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ color: '#52B788', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{p.zona}</div>
                <div style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{p.tipo}</div>
                <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>{p.hab}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1B3A5C', fontSize: '18px', fontWeight: 'bold' }}>{p.precio}</span>
                  <Link to="/propiedades" style={{ backgroundColor: '#1B3A5C', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none' }}>Ver más</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/propiedades" style={{ backgroundColor: '#1B3A5C', color: 'white', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            Ver todas las propiedades
          </Link>
        </div>
      </div>

      {/* PARA PROPIETARIOS */}
      <div id="propietarios" style={{ padding: '64px 40px', backgroundColor: 'white', textAlign: 'center' }}>
        <h2 style={{ color: '#1B3A5C', fontSize: '32px', marginBottom: '8px' }}>¿Tenés una propiedad para rentar?</h2>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '40px' }}>Publicá gratis y llegá a miles de inquilinos verificados en toda Centroamérica</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {[
            ['📋', 'Contratos digitales', 'Generamos el contrato automáticamente y lo firmamos en línea'],
            ['💳', 'Cobros seguros', 'Recibís el pago directo en tu cuenta cada mes'],
            ['📊', 'Dashboard completo', 'Controlá tus propiedades, inquilinos y pagos desde un solo lugar'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
              <div style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{desc}</div>
            </div>
          ))}
        </div>
        <Link
          to="/propiedades/nueva"
          style={{ backgroundColor: '#52B788', color: 'white', padding: '14px 40px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}
        >
          Publicar mi propiedad
        </Link>
      </div>

      {/* FOOTER */}
      <footer id="footer" style={{ backgroundColor: '#1B3A5C', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </div>
        <p style={{ color: '#CBD5E0', fontSize: '13px', marginBottom: '16px' }}>La plataforma de rentas de Centroamérica</p>
        <p style={{ color: '#718096', fontSize: '12px' }}>© 2026 RentaloLatam · Guatemala · admin@rentalolatam.com</p>
      </footer>

    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/propiedades" element={<Propiedades />} />
          <Route path="/propiedades/:id" element={<DetallePropiedad />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/propiedades/nueva"
            element={
              <ProtectedRoute>
                <NuevaPropiedad />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Navbar se exporta por si se necesita fuera, pero no se usa directamente en App
export { Navbar }
export default App
