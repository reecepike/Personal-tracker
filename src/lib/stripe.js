// Stripe data is fetched via a Vercel serverless function (/api/stripe)
// to keep your secret key out of the browser bundle.

export async function fetchStripeData() {
  try {
    const res = await fetch('/api/stripe')
    if (!res.ok) throw new Error('Stripe API error')
    return await res.json()
  } catch (err) {
    console.warn('Stripe fetch failed, using cached data', err)
    return null
  }
}

// Format pence to pounds
export function formatGBP(pence) {
  return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
