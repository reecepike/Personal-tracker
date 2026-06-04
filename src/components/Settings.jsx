import React, { useState } from 'react'
import { useApp } from '../App'
import { getGoogleAuthUrl, clearTokens } from '../lib/googleFit'
import { CreditCard, Activity, User, ChevronRight, CheckCircle2, ExternalLink, Save } from 'lucide-react'

const labelStyle = { fontSize: 11, fontWeight: 500, color: 'var(--text3)', display: 'block', marginBottom: 4 }
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'DM Sans, sans-serif',
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{title}</div>
      <div className="card" style={{ padding: '14px' }}>{children}</div>
    </div>
  )
}

function SettingRow({ label, sub, action, connected }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {connected && <CheckCircle2 size={14} color="var(--green)" />}
        {action}
      </div>
    </div>
  )
}

export default function Settings() {
  const { settings, setSettings, health, setHealth } = useApp()
  const [saved, setSaved] = useState(false)

  const update = (k, v) => setSettings(s => ({ ...s, [k]: v }))
  const updateHealth = (k, v) => setHealth(h => ({ ...h, [k]: parseFloat(v) || 0, lastUpdated: Date.now(), source: 'manual' }))

  const saveAll = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const connectGoogleFit = () => {
    window.location.href = getGoogleAuthUrl()
  }

  const disconnectGoogleFit = () => {
    clearTokens()
    update('googleFitConnected', false)
  }

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 0 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Connect your data and set your targets</p>
      </div>

      <Section title="Profile">
        <div>
          <label style={labelStyle}>Your name</label>
          <input value={settings.name} onChange={e => update('name', e.target.value)} style={inputStyle} />
        </div>
      </Section>

      <Section title="Revenue integrations">
        <SettingRow
          label="Stripe"
          sub={settings.stripeConnected ? 'Live MRR and revenue data' : 'Connect to see live revenue data'}
          connected={settings.stripeConnected}
          action={
            <button
              onClick={() => update('stripeConnected', !settings.stripeConnected)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 8,
                background: settings.stripeConnected ? 'var(--surface2)' : 'var(--text)',
                color: settings.stripeConnected ? 'var(--text2)' : '#fff',
                border: '1px solid var(--border)',
              }}>
              {settings.stripeConnected ? 'Disconnect' : 'Connect'}
            </button>
          }
        />
        {settings.stripeConnected && (
          <div style={{ marginTop: 12, padding: '10px', background: 'var(--surface2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Set in Vercel env vars:</div>
            <code style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'DM Mono, monospace', display: 'block', lineHeight: 1.8 }}>
              STRIPE_SECRET_KEY=sk_live_...
            </code>
          </div>
        )}
      </Section>

      <Section title="Health & fitness">
        <SettingRow
          label="Google Fit"
          sub={settings.googleFitConnected ? 'Steps, sleep & calories syncing' : 'Auto-sync from your phone'}
          connected={settings.googleFitConnected}
          action={
            <button
              onClick={settings.googleFitConnected ? disconnectGoogleFit : connectGoogleFit}
              style={{
                fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 8,
                background: settings.googleFitConnected ? 'var(--surface2)' : 'var(--text)',
                color: settings.googleFitConnected ? 'var(--text2)' : '#fff',
                border: '1px solid var(--border)',
              }}>
              {settings.googleFitConnected ? 'Disconnect' : 'Connect'}
            </button>
          }
        />
        {!settings.googleFitConnected && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>Manual health input</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Steps today', 'steps', health.steps],
                ['Sleep last night (h)', 'sleepHours', health.sleepHours],
                ['Calories burned', 'calories', health.calories],
                ['Water (litres)', 'waterLitres', health.waterLitres],
                ['Active minutes', 'workoutMins', health.workoutMins],
                ['Resting HR (bpm)', 'heartRate', health.heartRate],
              ].map(([lbl, key, val]) => (
                <div key={key}>
                  <label style={labelStyle}>{lbl}</label>
                  <input type="number" defaultValue={val} onBlur={e => updateHealth(key, e.target.value)} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Daily targets">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Daily revenue (£)', 'dailyRevenueTarget', settings.dailyRevenueTarget],
            ['RP MRR target (£)', 'rpMRRTarget', settings.rpMRRTarget],
            ['Lyne sales target', 'lyneSalesTarget', settings.lyneSalesTarget],
          ].map(([lbl, key, val]) => (
            <div key={key}>
              <label style={labelStyle}>{lbl}</label>
              <input type="number" defaultValue={val} onBlur={e => update(key, parseFloat(e.target.value) || 0)} style={inputStyle} />
            </div>
          ))}
          {[
            ['Steps goal', 'stepsGoal', health.stepsGoal],
            ['Sleep goal (h)', 'sleepGoal', health.sleepGoal],
            ['Workout goal (min)', 'workoutGoal', health.workoutGoal],
          ].map(([lbl, key, val]) => (
            <div key={key}>
              <label style={labelStyle}>{lbl}</label>
              <input type="number" defaultValue={val} onBlur={e => setHealth(h => ({ ...h, [key]: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Setup guide">
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>Deploy to Vercel in 5 minutes:</div>
          <div>1. Push this project to a GitHub repo</div>
          <div>2. Import to <a href="https://vercel.com" style={{ color: 'var(--blue)' }}>vercel.com</a></div>
          <div>3. Add env vars (below)</div>
          <div>4. Deploy — done</div>
          <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
            <code style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', display: 'block', lineHeight: 2, color: 'var(--text)' }}>
              STRIPE_SECRET_KEY=sk_live_...<br/>
              ANTHROPIC_API_KEY=sk-ant-...<br/>
              VITE_GOOGLE_CLIENT_ID=your_id<br/>
              GOOGLE_CLIENT_SECRET=your_secret<br/>
              VITE_APP_URL=https://yourdomain.com
            </code>
          </div>
        </div>
      </Section>

      <button onClick={saveAll} style={{
        width: '100%', padding: '14px', borderRadius: 10,
        background: saved ? 'var(--green)' : 'var(--text)', color: '#fff',
        fontSize: 14, fontWeight: 600, marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'background 0.2s',
      }}>
        {saved ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Save settings</>}
      </button>
    </div>
  )
}
