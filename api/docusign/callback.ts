import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const DOCUSIGN_BASE = 'https://account-d.docusign.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code    = req.query['code']  as string | undefined
  const userId  = req.query['state'] as string | undefined
  const errParam = req.query['error'] as string | undefined

  const appUrl = process.env['APP_URL'] ?? `https://${process.env['VERCEL_URL']}`

  if (errParam) {
    return res.redirect(302, `${appUrl}/inquilinos?docusign_error=${encodeURIComponent(errParam)}`)
  }

  if (!code || !userId) {
    return res.status(400).send('Parámetros inválidos en el callback.')
  }

  const integrationKey = process.env['DOCUSIGN_INTEGRATION_KEY']!
  const secretKey      = process.env['DOCUSIGN_SECRET_KEY']!
  const redirectUri    = `${appUrl}/api/docusign/callback`

  // Intercambiar código por tokens
  const tokenRes = await fetch(`${DOCUSIGN_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${integrationKey}:${secretKey}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!tokenRes.ok) {
    const txt = await tokenRes.text()
    return res.status(502).send(`DocuSign error: ${txt}`)
  }

  const token = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const expiresAt = new Date(Date.now() + token.expires_in * 1_000).toISOString()

  const supabase = createClient(
    process.env['VITE_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  )

  const { error } = await supabase.from('docusign_tokens').upsert(
    {
      user_id:       userId,
      access_token:  token.access_token,
      refresh_token: token.refresh_token,
      expires_at:    expiresAt,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return res.status(500).send(`Error guardando token: ${error.message}`)
  }

  return res.redirect(302, `${appUrl}/inquilinos?docusign=conectado`)
}
