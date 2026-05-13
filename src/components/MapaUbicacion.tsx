import { useState, useEffect } from 'react'
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
  fillColor: '#1B3A5C',
  fillOpacity: 0.4,
  strokeWeight: 2,
  strokeColor: '#1B3A5C',
  strokeOpacity: 0.6,
  clickable: false,
}

type Props = {
  zona?: string | null
  municipio?: string | null
  departamento?: string | null
  pais: string
}

export default function MapaUbicacion({ zona, municipio, departamento, pais }: Props) {
  const [coords, setCoords] = useState<google.maps.LatLngLiteral | null>(null)
  const [geocodeFallido, setGeocodeFallido] = useState(false)

  const address = [zona, municipio, departamento, pais].filter(Boolean).join(', ')

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY })

  useEffect(() => {
    if (!address || !API_KEY) return
    let cancelled = false
    const geocode = async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
        )
        const data = await res.json()
        if (!cancelled) {
          if (data.status === 'OK' && data.results[0]) {
            setCoords(data.results[0].geometry.location)
          } else {
            setGeocodeFallido(true)
          }
        }
      } catch {
        if (!cancelled) setGeocodeFallido(true)
      }
    }
    geocode()
    return () => { cancelled = true }
  }, [address])

  const placeholder = (mensaje: string) => (
    <div style={{
      height: '360px', borderRadius: '14px', backgroundColor: '#F0F4F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid #E2E8F0',
    }}>
      <p style={{ color: '#999', fontSize: '14px' }}>{mensaje}</p>
    </div>
  )

  if (!isLoaded || (!coords && !geocodeFallido)) return placeholder('Cargando mapa...')
  if (geocodeFallido || !coords) return placeholder('No se pudo cargar el mapa para esta ubicación.')

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
