import type { VercelRequest, VercelResponse } from '@vercel/node'

const DOCUSIGN_BASE = 'https://demo.docusign.net'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.query['user_id'] as string | undefined
  if (!userId) {
    return res.status(400).json({ error: 'user_id requerido como query param' })
  }

  const integrationKey = process.env['DOCUSIGN_INTEGRATION_KEY']
  const appUrl = process.env['APP_URL'] ?? `https://${process.env['VERCEL_URL']}`

  if (!integrationKey) {
    return res.status(500).json({ error: 'DOCUSIGN_INTEGRATION_KEY no configurada' })
  }

  const redirectUri = `${appUrl}/api/docusign/callback`

  const url = new URL(`${DOCUSIGN_BASE}/oauth/auth`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'signature')
  url.searchParams.set('client_id', integrationKey)
  url.searchParams.set('state', userId)
  url.searchParams.set('redirect_uri', redirectUri)

  return res.redirect(302, url.toString())
}
