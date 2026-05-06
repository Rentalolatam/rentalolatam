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
  publicado_por: string | null
  created_at: string
}

export type Inquilino = {
  id: string
  user_id: string | null
  propietario_id: string | null
  nombre_completo: string
  email: string
  telefono: string | null
  fecha_nacimiento: string | null
  tipo_documento: 'DPI' | 'Pasaporte' | null
  numero_documento: string | null
  nacionalidad: string
  estado: 'basico' | 'documentos_pendientes' | 'listo'
  invitado_por_propietario: boolean
  created_at: string
}

export type TipoDocumento =
  | 'dpi_frente'
  | 'dpi_reverso'
  | 'recibo_servicio'
  | 'antecedentes_policiales'
  | 'antecedentes_penales'
  | 'prueba_ingresos'

export type DocumentoInquilino = {
  id: string
  inquilino_id: string
  tipo: TipoDocumento
  url: string
  nombre_archivo: string | null
  created_at: string
}
