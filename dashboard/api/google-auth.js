// api/google-auth.js — exchanges auth code for tokens
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'No code provided' })

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.VITE_APP_URL + '/auth/google',
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) throw new Error(tokens.error_description || tokens.error)

    res.status(200).json(tokens)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
