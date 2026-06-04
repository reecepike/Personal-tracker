import React, { useEffect, useState } from 'react'
import { useApp } from '../App'
import { storeTokens } from '../lib/googleFit'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export default function GoogleAuthCallback() {
  const { setSettings, setPage } = useApp()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) { setStatus('error'); return }

    fetch('/api/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(r => r.json())
      .then(tokens => {
        if (tokens.error) { setStatus('error'); return }
        storeTokens(tokens)
        setSettings(s => ({ ...s, googleFitConnected: true }))
        setStatus('success')
        setTimeout(() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }, 1500)
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <Loader2 size={32} className="spinner" color="var(--blue)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Connecting Google Fit...</div>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={32} color="var(--green)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Google Fit connected!</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Redirecting...</div>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle size={32} color="var(--red)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Connection failed</div>
            <button onClick={() => setPage('settings')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, background: 'var(--text)', color: '#fff', fontSize: 13 }}>
              Back to settings
            </button>
          </>
        )}
      </div>
    </div>
  )
}
