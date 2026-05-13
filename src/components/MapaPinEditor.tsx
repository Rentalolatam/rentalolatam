import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  scrollwheel: true,
  clickableIcons: false,
}

type Props = {
  center: google.maps.LatLngLiteral
  onCoordChange: (lat: number, lng: number) => void
}

export default function MapaPinEditor({ center, onCoordChange }: Props) {
  const [pin, setPin] = useState<google.maps.LatLngLiteral>(center)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY })

  // Re-center map and reset pin when country changes
  useEffect(() => {
    setPin(center)
    mapRef.current?.panTo(center)
    onCoordChange(center.lat, center.lng)
  }, [center.lat, center.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  const move = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng })
    onCoordChange(lat, lng)
  }, [onCoordChange])

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

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
      center={center}
      zoom={12}
      options={MAP_OPTIONS}
      onLoad={handleLoad}
      onClick={handleMapClick}
    >
      <Marker position={pin} draggable onDragEnd={handleDragEnd} />
    </GoogleMap>
  )
}
