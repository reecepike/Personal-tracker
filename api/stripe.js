// api/stripe.js — Vercel Edge Function
// Fetches MRR, recent charges, and subscription count from Stripe

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_KEY) return res.status(400).json({ error: 'STRIPE_SECRET_KEY not set' })

  const headers = {
    Authorization: `Bearer ${STRIPE_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  try {
    // Fetch active subscriptions and recent charges in parallel
    const [subsRes, chargesRes, balanceRes] = await Promise.all([
      fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', { headers }),
      fetch('https://api.stripe.com/v1/charges?limit=10', { headers }),
      fetch('https://api.stripe.com/v1/balance', { headers }),
    ])

    const [subs, charges, balance] = await Promise.all([
      subsRes.json(),
      chargesRes.json(),
      balanceRes.json(),
    ])

    // Calculate MRR from active subscriptions
    let mrr = 0
    if (subs.data) {
      subs.data.forEach(sub => {
        const amount = sub.plan?.amount ?? sub.items?.data?.[0]?.plan?.amount ?? 0
        const interval = sub.plan?.interval ?? sub.items?.data?.[0]?.plan?.interval ?? 'month'
        const intervalCount = sub.plan?.interval_count ?? 1
        if (interval === 'month') mrr += amount / intervalCount
        if (interval === 'year') mrr += amount / 12
        if (interval === 'week') mrr += (amount * 52) / 12
      })
    }

    // This month's revenue
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const monthCharges = charges.data?.filter(c => c.paid && !c.refunded && c.created * 1000 >= startOfMonth.getTime()) ?? []
    const monthRevenue = monthCharges.reduce((sum, c) => sum + c.amount, 0)

    // Today's revenue
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0)
    const todayCharges = charges.data?.filter(c => c.paid && !c.refunded && c.created * 1000 >= startOfDay.getTime()) ?? []
    const todayRevenue = todayCharges.reduce((sum, c) => sum + c.amount, 0)

    // Available balance
    const availableBalance = balance.available?.find(b => b.currency === 'gbp')?.amount ?? 0

    res.status(200).json({
      mrr,
      mrrFormatted: '£' + Math.round(mrr / 100).toLocaleString('en-GB'),
      monthRevenue,
      monthRevenueFormatted: '£' + Math.round(monthRevenue / 100).toLocaleString('en-GB'),
      todayRevenue,
      todayRevenueFormatted: '£' + Math.round(todayRevenue / 100).toLocaleString('en-GB'),
      activeSubscriptions: subs.data?.length ?? 0,
      availableBalance,
      recentCharges: charges.data?.slice(0, 5).map(c => ({
        id: c.id,
        amount: c.amount,
        amountFormatted: '£' + (c.amount / 100).toFixed(2),
        description: c.description || c.metadata?.product || 'Payment',
        created: c.created,
        paid: c.paid,
      })) ?? [],
      fetchedAt: Date.now(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
