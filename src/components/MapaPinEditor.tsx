import { useState, useCallback } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const GUATEMALA_CITY: google.maps.LatLngLiteral = { lat: 14.6349, lng: -90.5069 }

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  scrollwheel: true,
  clickableIcons: false,
}

type Props = {
  initialLat?: number | null
  initialLng?: number | null
  onCoordChange: (lat: number, lng: number) => void
}

export default function MapaPinEditor({ initialLat, initialLng, onCoordChange }: Props) {
  const hasInitial = initialLat != null && initialLng != null
  const [pin, setPin] = useState<google.maps.LatLngLiteral>(
    hasInitial ? { lat: initialLat!, lng: initialLng! } : GUATEMALA_CITY
  )

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY })

  const move = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng })
    onCoordChange(lat, lng)
  }, [onCoordChange])

  const handleDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) move(e.latLng.lat(), e.latLng.lng())
  }, [move])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) move(e.latLng.lat(), e.latLng.lng())
  }, [move])

  if (!isLoaded) {
    return (
      <div style={{ height: '340px', borderRadius: '12px', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
        <p style={{ color: '#999', fontSize: '14px' }}>Cargando mapa...</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '340px', borderRadius: '12px' }}
      center={hasInitial ? { lat: initialLat!, lng: initialLng! } : GUATEMALA_CITY}
      zoom={13}
      options={MAP_OPTIONS}
      onClick={handleMapClick}
    >
      <Marker position={pin} draggable onDragEnd={handleDragEnd} />
    </GoogleMap>
  )
}
