import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Propiedad = {
  id: string
  titulo: string
  tipo: 'Apartamento' | 'Casa' | 'Estudio' | 'Loft'
  pais: string
  zona: string
  precio_quetzales: number
  precio_dolares: number
  incluye_iva: boolean
  incluye_mantenimiento: boolean
  habitaciones: number
  banos: number
  tiene_parqueo: boolean
  cantidad_parqueos: number | null
  amueblado: boolean
  metraje_sin_parqueo: number | null
  metraje_con_parqueo: number | null
  descripcion: string | null
  fotos: string[]
  estado: 'disponible' | 'arrendado' | 'en mantenimiento'
  created_at: string
}
