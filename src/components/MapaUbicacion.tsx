import { GoogleMap, Circle, useJsApiLoader } from '@react-google-maps/api'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: false,
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

const CIRCLE_OPTIONS: google.maps.CircleOptions = {
  fillColor: '#14B8A6',
  fillOpacity: 0.4,
  strokeWeight: 0,
  clickable: false,
}

type Props = {
  lat: number
  lng: number
}

export default function MapaUbicacion({ lat, lng }: Props) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY })

  const coords = { lat, lng }

  if (!isLoaded) {
    return (
      <div style={{ height: '360px', borderRadius: '14px', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
        <p style={{ color: '#999', fontSize: '14px' }}>Cargando mapa...</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '360px', borderRadius: '14px' }}
      center={coords}
      zoom={14}
      options={MAP_OPTIONS}
    >
      <Circle center={coords} radius={500} options={CIRCLE_OPTIONS} />
    </GoogleMap>
  )
}
