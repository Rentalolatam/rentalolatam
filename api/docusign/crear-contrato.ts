import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const DOCUSIGN_BASE   = 'https://demo.docusign.net'
const DOCUSIGN_API    = `${DOCUSIGN_BASE}/restapi/v2.1`

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function buildContratoHtml(vars: {
  fecha: string
  nombre_propietario: string
  dpi_propietario: string
  nombre_inquilino: string
  dpi_inquilino: string
  titulo_propiedad: string
  zona: string
  metraje: string
  fecha_inicio: string
  fecha_fin: string
  precio_quetzales: string
  precio_usd: string
  iva_incluido: string
  mantenimiento_incluido: string
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12pt; max-width: 750px;
           margin: 0 auto; padding: 40px; color: #000; line-height: 1.6; }
    h2   { text-align: center; text-transform: uppercase; font-size: 14pt; }
    p    { text-align: justify; margin: 0 0 10px; }
    .clausula { font-weight: bold; }
    .firmas  { width: 100%; margin-top: 60px; border-collapse: collapse; }
    .firmas td { width: 50%; text-align: center; padding: 20px 30px 8px; vertical-align: top; }
    .anchor  { font-size: 1px; color: white; user-select: none; }
    .linea   { border-top: 1px solid #000; margin: 0 auto; width: 220px; }
    .nombre  { margin-top: 6px; font-size: 11pt; }
  </style>
</head>
<body>

<h2>Contrato de Arrendamiento de Bien Inmueble</h2>

<p>En la ciudad de Guatemala, <strong>${vars.fecha}</strong> comparecemos:</p>

<p><strong>${vars.nombre_propietario}</strong>, guatemalteco, identificado con DPI
<strong>${vars.dpi_propietario}</strong>, en adelante <em>"EL ARRENDANTE"</em>; y</p>

<p><strong>${vars.nombre_inquilino}</strong>, identificado con DPI
<strong>${vars.dpi_inquilino}</strong>, en adelante <em>"EL ARRENDATARIO"</em>.</p>

<p class="clausula">PRIMERA &ndash; OBJETO:</p>
<p>El Arrendante da en arrendamiento el inmueble denominado
<strong>"${vars.titulo_propiedad}"</strong>, ubicado en Zona ${vars.zona}, Guatemala,
con área aproximada de <strong>${vars.metraje}</strong> m².</p>

<p class="clausula">SEGUNDA &ndash; PLAZO:</p>
<p>El contrato tendrá una vigencia desde el <strong>${vars.fecha_inicio}</strong>
hasta el <strong>${vars.fecha_fin}</strong>.</p>

<p class="clausula">TERCERA &ndash; RENTA:</p>
<p>La renta mensual pactada es de <strong>Q${vars.precio_quetzales}</strong>
(aproximadamente US$${vars.precio_usd}), pagadera los primeros cinco (5) días
de cada mes. IVA: ${vars.iva_incluido}. Mantenimiento: ${vars.mantenimiento_incluido}.</p>

<p class="clausula">CUARTA &ndash; DEPÓSITO:</p>
<p>El Arrendatario entregará al inicio del contrato un depósito equivalente a un (1)
mes de renta (<strong>Q${vars.precio_quetzales}</strong>), reembolsable al término
si el inmueble es devuelto en las mismas condiciones.</p>

<p class="clausula">QUINTA &ndash; DESTINO:</p>
<p>El inmueble se destinará exclusivamente a vivienda familiar, prohibiéndose
cualquier uso comercial o industrial sin autorización escrita del Arrendante.</p>

<p class="clausula">SEXTA &ndash; PENALIZACIÓN POR SALIDA ANTICIPADA:</p>
<p>La rescisión anticipada por parte del Arrendatario obligará al pago de un (1) mes
adicional de renta como penalización.</p>

<p class="clausula">SÉPTIMA &ndash; INTERESES MORATORIOS:</p>
<p>Las cuotas vencidas y no pagadas generarán intereses moratorios del tres por ciento
(3%) mensual sobre el saldo insoluto.</p>

<p class="clausula">OCTAVA &ndash; PLATAFORMA:</p>
<p>El presente contrato es gestionado a través de la plataforma
<strong>RentaLo Latam</strong> (rentalolatam.com), quien actúa como intermediario
tecnológico sin asumir responsabilidad por incumplimientos de las partes.</p>

<p>Leído y entendido el presente instrumento, lo aceptamos y firmamos de conformidad
en la ciudad de Guatemala, en la fecha indicada.</p>

<table class="firmas">
  <tr>
    <td>
      <span class="anchor">[[FIRMA_ARRENDANTE]]</span>
      <div class="linea"></div>
      <div class="nombre"><strong>EL ARRENDANTE</strong><br/>${vars.nombre_propietario}</div>
    </td>
    <td>
      <span class="anchor">[[FIRMA_ARRENDATARIO]]</span>
      <div class="linea"></div>
      <div class="nombre"><strong>EL ARRENDATARIO</strong><br/>${vars.nombre_inquilino}</div>
    </td>
  </tr>
</table>

</body>
</html>`
}

/* ── Token management ─────────────────────────────────────────────────────── */

async function obtenerTokenValido(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  const { data } = await supabase
    .from('docusign_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  const tokenRow = data as { access_token: string; refresh_token: string; expires_at: string }
  const isExpired = new Date(tokenRow.expires_at) <= new Date(Date.now() + 60_000)

  if (!isExpired) return tokenRow.access_token

  // Refresh
  const creds = Buffer.from(
    `${process.env['DOCUSIGN_INTEGRATION_KEY']}:${process.env['DOCUSIGN_SECRET_KEY']}`,
  ).toString('base64')

  const refreshRes = await fetch(`${DOCUSIGN_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${creds}`,
    },
    body: `grant_type=refresh_token&refresh_token=${tokenRow.refresh_token}`,
  })

  if (!refreshRes.ok) return null

  const refreshed = await refreshRes.json() as {
    access_token: string; refresh_token: string; expires_in: number
  }
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1_000).toISOString()

  await supabase.from('docusign_tokens').update({
    access_token:  refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at:    expiresAt,
  }).eq('user_id', userId)

  return refreshed.access_token
}

/* ── Main handler ─────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // — Autenticar al propietario via Supabase JWT —
  const authHeader = req.headers['authorization'] ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  if (!jwt) return res.status(401).json({ error: 'Token de sesión requerido' })

  const supabaseAdmin = createClient(
    process.env['VITE_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  )

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' })

  const propietarioId = user.id

  // — Parsear body —
  const body = req.body as {
    solicitud_id?: string
    fecha_inicio?: string
    fecha_fin?: string
  }
  const { solicitud_id, fecha_inicio, fecha_fin } = body

  if (!solicitud_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'solicitud_id, fecha_inicio y fecha_fin son requeridos' })
  }

  // — Cargar solicitud + propiedad —
  const { data: solData, error: solErr } = await supabaseAdmin
    .from('solicitudes_arriendo')
    .select('*, propiedades(titulo, zona, precio_quetzales, precio_dolares, metraje_sin_parqueo, incluye_iva, incluye_mantenimiento)')
    .eq('id', solicitud_id)
    .eq('propietario_id', propietarioId)
    .single()

  if (solErr || !solData) {
    return res.status(404).json({ error: 'Solicitud no encontrada o no autorizada' })
  }

  const sol = solData as {
    id: string
    inquilino_id: string
    propietario_id: string
    inquilino_nombre: string | null
    propiedades: {
      titulo: string
      zona: string
      precio_quetzales: number
      precio_dolares: number
      metraje_sin_parqueo: number | null
      incluye_iva: boolean
      incluye_mantenimiento: boolean
    }
  }

  // — Obtener email/nombre del propietario e inquilino vía Admin API —
  const [{ data: { user: propietarioUser } }, { data: { user: inquilinoUser } }] =
    await Promise.all([
      supabaseAdmin.auth.admin.getUserById(sol.propietario_id),
      supabaseAdmin.auth.admin.getUserById(sol.inquilino_id),
    ])

  const propietarioEmail  = propietarioUser?.email ?? ''
  const propietarioNombre = (propietarioUser?.user_metadata?.['nombre'] as string | undefined)
    ?? propietarioEmail.split('@')[0] ?? 'Propietario'

  const inquilinoEmail  = inquilinoUser?.email ?? ''
  const inquilinoNombre = sol.inquilino_nombre
    ?? (inquilinoUser?.user_metadata?.['nombre'] as string | undefined)
    ?? inquilinoEmail.split('@')[0] ?? 'Inquilino'

  // — Intentar obtener DPI del inquilino desde tabla inquilinos —
  const { data: inqRow } = await supabaseAdmin
    .from('inquilinos')
    .select('numero_documento')
    .eq('user_id', sol.inquilino_id)
    .maybeSingle()

  const dpiInquilino   = (inqRow as { numero_documento?: string } | null)?.numero_documento ?? '—'
  const dpiPropietario = '—'  // no almacenado en el sistema actualmente

  // — Obtener token DocuSign del propietario —
  const accessToken = await obtenerTokenValido(propietarioId, supabaseAdmin)
  if (!accessToken) {
    return res.status(403).json({
      error: 'docusign_no_conectado',
      message: 'El propietario no ha autorizado DocuSign. Conecte su cuenta primero.',
    })
  }

  // — Generar HTML del contrato —
  const prop = sol.propiedades
  const htmlContrato = buildContratoHtml({
    fecha:              formatFecha(new Date().toISOString()),
    nombre_propietario: propietarioNombre,
    dpi_propietario:    dpiPropietario,
    nombre_inquilino:   inquilinoNombre,
    dpi_inquilino:      dpiInquilino,
    titulo_propiedad:   prop.titulo,
    zona:               prop.zona,
    metraje:            prop.metraje_sin_parqueo?.toString() ?? '—',
    fecha_inicio:       formatFecha(fecha_inicio),
    fecha_fin:          formatFecha(fecha_fin),
    precio_quetzales:   prop.precio_quetzales.toLocaleString('es-GT'),
    precio_usd:         prop.precio_dolares.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    iva_incluido:       prop.incluye_iva ? 'Incluido' : 'No incluido',
    mantenimiento_incluido: prop.incluye_mantenimiento ? 'Incluido' : 'No incluido',
  })

  const docBase64 = Buffer.from(htmlContrato, 'utf-8').toString('base64')

  // — Crear envelope en DocuSign —
  const accountId = process.env['DOCUSIGN_ACCOUNT_ID']!

  const envelopeBody = {
    emailSubject: `Contrato de arrendamiento — ${prop.titulo} — Firma requerida`,
    documents: [
      {
        documentBase64: docBase64,
        name:           'Contrato de Arrendamiento',
        fileExtension:  'html',
        documentId:     '1',
      },
    ],
    recipients: {
      signers: [
        {
          email:       propietarioEmail,
          name:        propietarioNombre,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [
              {
                anchorString:  '[[FIRMA_ARRENDANTE]]',
                anchorXOffset: '10',
                anchorYOffset: '-5',
                anchorUnits:   'pixels',
              },
            ],
          },
        },
        {
          email:       inquilinoEmail,
          name:        inquilinoNombre,
          recipientId: '2',
          routingOrder: '2',
          tabs: {
            signHereTabs: [
              {
                anchorString:  '[[FIRMA_ARRENDATARIO]]',
                anchorXOffset: '10',
                anchorYOffset: '-5',
                anchorUnits:   'pixels',
              },
            ],
          },
        },
      ],
    },
    status: 'sent',
  }

  const dsRes = await fetch(`${DOCUSIGN_API}/accounts/${accountId}/envelopes`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${accessToken}`,
    },
    body: JSON.stringify(envelopeBody),
  })

  if (!dsRes.ok) {
    const dsErr = await dsRes.text()
    return res.status(502).json({ error: `DocuSign error: ${dsErr}` })
  }

  const dsData = await dsRes.json() as { envelopeId: string }
  const envelopeId = dsData.envelopeId

  // — Guardar contrato en Supabase —
  const { data: contratoData, error: contratoErr } = await supabaseAdmin
    .from('contratos')
    .insert({
      solicitud_id,
      propietario_id: sol.propietario_id,
      inquilino_id:   sol.inquilino_id,
      propiedad_id:   (sol as { propiedad_id?: string }).propiedad_id,
      envelope_id:    envelopeId,
      estado:         'enviado',
      fecha_inicio,
      fecha_fin,
    })
    .select()
    .single()

  if (contratoErr) {
    // El envelope fue creado pero no se guardó localmente — devolvemos el envelope_id igual
    return res.status(207).json({
      envelope_id: envelopeId,
      warning:     `Contrato enviado pero error guardando en BD: ${contratoErr.message}`,
    })
  }

  return res.status(201).json({ contrato: contratoData, envelope_id: envelopeId })
}
