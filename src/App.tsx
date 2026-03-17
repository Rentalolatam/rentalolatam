function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
      
      {/* NAVBAR */}
      <nav style={{ backgroundColor: '#1B3A5C', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '22px', fontWeight: 'bold' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Propiedades</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Para propietarios</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Contacto</a>
          <a href="#" style={{ backgroundColor: '#52B788', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>Publicar propiedad</a>
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
          <button style={{ backgroundColor: '#52B788', color: 'white', padding: '14px 32px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
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
                  <button style={{ backgroundColor: '#1B3A5C', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Ver más</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PARA PROPIETARIOS */}
      <div style={{ padding: '64px 40px', backgroundColor: 'white', textAlign: 'center' }}>
        <h2 style={{ color: '#1B3A5C', fontSize: '32px', marginBottom: '8px' }}>¿Tenés una propiedad para rentar?</h2>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '40px' }}>Publicá gratis y llegá a miles de inquilinos verificados en toda Centroamérica</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {[['📋', 'Contratos digitales', 'Generamos el contrato automáticamente y lo firmamos en línea'], ['💳', 'Cobros seguros', 'Recibís el pago directo en tu cuenta cada mes'], ['📊', 'Dashboard completo', 'Controlá tus propiedades, inquilinos y pagos desde un solo lugar']].map(([icon, title, desc]) => (
            <div key={title} style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
              <div style={{ color: '#1B3A5C', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{desc}</div>
            </div>
          ))}
        </div>
        <button style={{ backgroundColor: '#52B788', color: 'white', padding: '14px 40px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          Publicar mi propiedad
        </button>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#1B3A5C', padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Rentalo<span style={{ color: '#52B788' }}>Latam</span>
        </div>
        <p style={{ color: '#CBD5E0', fontSize: '13px', marginBottom: '16px' }}>La plataforma de rentas de Centroamérica</p>
        <p style={{ color: '#718096', fontSize: '12px' }}>© 2026 RentaloLatam · Guatemala · admin@rentalolatam.com</p>
      </footer>

    </div>
  )
}

export default App