const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read',
].join(' ')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin + '/auth/google',
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export function getStoredTokens() {
  try {
    const t = localStorage.getItem('gfit_tokens')
    return t ? JSON.parse(t) : null
  } catch { return null }
}

export function storeTokens(tokens) {
  localStorage.setItem('gfit_tokens', JSON.stringify({ ...tokens, stored_at: Date.now() }))
}

export function clearTokens() {
  localStorage.removeItem('gfit_tokens')
}

function todayRange() {
  const now = Date.now()
  const start = new Date(); start.setHours(0,0,0,0)
  return { startTimeMillis: start.getTime(), endTimeMillis: now }
}

function yesterdayRange() {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const start = new Date(yesterday); start.setHours(0,0,0,0)
  const end = new Date(yesterday); end.setHours(23,59,59,999)
  return { startTimeMillis: start.getTime(), endTimeMillis: end.getTime() }
}

async function fitAggregate(token, dataTypeName, { startTimeMillis, endTimeMillis }) {
  const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
      startTimeMillis,
      endTimeMillis,
    }),
  })
  if (!res.ok) throw new Error('Google Fit API error')
  return res.json()
}

function extractVal(data, field = 'intVal') {
  try {
    return data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.[field] ?? null
  } catch { return null }
}

export async function fetchFitnessData(accessToken) {
  const today = todayRange()
  const yesterday = yesterdayRange()
  try {
    const [steps, cals, sleep, hr] = await Promise.allSettled([
      fitAggregate(accessToken, 'com.google.step_count.delta', today),
      fitAggregate(accessToken, 'com.google.calories.expended', today),
      fitAggregate(accessToken, 'com.google.sleep.segment', yesterday),
      fitAggregate(accessToken, 'com.google.heart_rate.bpm', today),
    ])

    const stepsVal = steps.status === 'fulfilled' ? (extractVal(steps.value) ?? 0) : 0
    const calsVal = cals.status === 'fulfilled' ? Math.round(extractVal(cals.value, 'fpVal') ?? 0) : 0
    const hrVal = hr.status === 'fulfilled' ? Math.round(extractVal(hr.value, 'fpVal') ?? 0) : 0

    // Sleep: sum duration of sleep segments (type 57 = SLEEP, 72 = LIGHT, 73 = DEEP, 74 = REM)
    let sleepMins = 0
    if (sleep.status === 'fulfilled') {
      const points = sleep.value?.bucket?.[0]?.dataset?.[0]?.point ?? []
      points.forEach(p => {
        if ([57,72,73,74].includes(p.value?.[0]?.intVal)) {
          const dur = (parseInt(p.endTimeNanos) - parseInt(p.startTimeNanos)) / 1e9 / 60
          sleepMins += dur
        }
      })
    }

    return {
      steps: stepsVal,
      calories: calsVal,
      heartRate: hrVal,
      sleepHours: parseFloat((sleepMins / 60).toFixed(1)),
      source: 'google_fit',
      fetchedAt: Date.now(),
    }
  } catch (err) {
    console.warn('Fitness fetch error', err)
    return null
  }
}
