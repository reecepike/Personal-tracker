import React from 'react'
import { useApp } from '../App'
import { LayoutDashboard, Target, Settings, CalendarDays } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Today', Icon: LayoutDashboard },
  { id: 'planner', label: 'Goals', Icon: Target },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export default function Nav() {
  const { page, setPage } = useApp()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = page === id || (page === 'goal' && id === 'planner')
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '10px 0 8px',
              color: active ? 'var(--text)' : 'var(--text3)',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, letterSpacing: '0.02em' }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
