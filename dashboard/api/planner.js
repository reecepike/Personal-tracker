// api/planner.js — Vercel Serverless Function
// Proxies goal planning requests to Anthropic API

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) return res.status(400).json({ error: 'ANTHROPIC_API_KEY not set' })

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)
    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // Strip any markdown fences
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    res.status(200).json({ content: clean })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
