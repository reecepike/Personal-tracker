import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../App'
import { prioritiseTasks } from '../lib/planner'
import { fetchStripeData } from '../lib/stripe'
import { fetchFitnessData, getStoredTokens } from '../lib/googleFit'
import { format } from 'date-fns'
import {
  Zap, TrendingUp, Moon, Footprints, Heart, Droplets, Dumbbell,
  ChevronRight, Plus, Circle, CheckCircle2, RefreshCw, Bike, Building2,
  Flame, Target, ArrowUp, ArrowDown, Clock, AlertCircle
} from 'lucide-react'

function ScoreRing({ score }) {
  const r = 28, circ = 2 * Math.PI * r
  const offset = circ - (circ * score / 100)
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--surface2)" strokeWidth={5} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={36} y={40} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="DM Sans" fill="var(--text)">{score}</text>
    </svg>
  )
}

function MetricCard({ icon: Icon, label, value, sub, chipColor, chipText, progress, progressColor }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color="var(--text3)" />
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
      {chipText && <span className={`chip chip-${chipColor}`} style={{ marginTop: 6 }}>{chipText}</span>}
      {progress !== undefined && (
        <div className="progress-track" style={{ marginTop: 8 }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%`, background: progressColor || 'var(--blue)' }} />
        </div>
      )}
    </div>
  )
}

function GoalProgress({ goal, onTap }) {
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  const colorMap = { blue: '#2563eb', teal: '#0d9488', green: '#16a34a', amber: '#d97706' }
  const color = colorMap[goal.color] || '#2563eb'
  return (
    <div onClick={onTap} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
        {goal.unit === '£' ? `£${goal.currentValue.toLocaleString()} / £${goal.targetValue.toLocaleString()}` : `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { goals, tasks, setTasks, health, settings, stripeData, setStripeData, setSelectedGoalId, setPage } = useApp()
  const [refreshing, setRefreshing] = useState(false)
  const today = format(new Date(), 'EEEE, d MMMM')

  const todayTasks = tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0])
  const prioritised = prioritiseTasks(todayTasks, goals)
  const doneTasks = prioritised.filter(t => t.done).length
  const score = Math.round(
    (doneTasks / Math.max(1, prioritised.length)) * 40 +
    Math.min(40, (health.steps / health.stepsGoal) * 20 + (health.sleepHours / health.sleepGoal) * 20) +
    20
  )

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [setTasks])

  const refreshLiveData = async () => {
    setRefreshing(true)
    const [stripe] = await Promise.allSettled([
      settings.stripeConnected ? fetchStripeData() : Promise.resolve(null),
    ])
    if (stripe.status === 'fulfilled' && stripe.value) setStripeData(stripe.value)
    setRefreshing(false)
  }

  const doneCount = tasks.filter(t => t.done && t.dueDate === new Date().toISOString().split('T')[0]).length
  const totalToday = todayTasks.length

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Good morning, {settings.name} 👋</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{today}</p>
        </div>
        <button onClick={refreshLiveData} style={{ padding: 8, color: 'var(--text3)', borderRadius: 8 }}>
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
        </button>
      </div>

      {/* Score panel */}
      <div className="card fade-in" style={{ padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <ScoreRing score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Today's score</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {doneTasks}/{prioritised.length} tasks · {health.steps.toLocaleString()} steps · {health.sleepHours}h sleep
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`chip chip-${score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red'}`}>
              {score >= 80 ? '🔥 On fire' : score >= 60 ? '⚡ On track' : '⚠️ Needs focus'}
            </span>
            {health.source === 'google_fit' && <span className="chip chip-blue">Live health data</span>}
          </div>
        </div>
      </div>

      {/* Health metrics */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <MetricCard icon={Footprints} label="Steps" value={health.steps.toLocaleString()} sub={`${Math.max(0, health.stepsGoal - health.steps).toLocaleString()} to go`} progress={(health.steps / health.stepsGoal) * 100} progressColor="#2563eb" />
        <MetricCard icon={Moon} label="Sleep" value={`${health.sleepHours}h`} chipColor={health.sleepHours >= health.sleepGoal ? 'green' : health.sleepHours >= 6 ? 'amber' : 'red'} chipText={health.sleepHours >= health.sleepGoal ? 'Good' : 'Short'} progress={(health.sleepHours / health.sleepGoal) * 100} progressColor="#7c3aed" />
        <MetricCard icon={Dumbbell} label="Active" value={`${health.workoutMins}min`} sub={`Goal: ${health.workoutGoal}min`} progress={(health.workoutMins / health.workoutGoal) * 100} progressColor="#16a34a" />
        <MetricCard icon={Droplets} label="Water" value={`${health.waterLitres}L`} sub={`Goal: ${health.waterGoal}L`} progress={(health.waterLitres / health.waterGoal) * 100} progressColor="#0d9488" />
      </div>

      {/* Business */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Business</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Building2 size={13} color="var(--text3)" />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>RP Studio MRR</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {stripeData ? stripeData.mrrFormatted : `£${(2840).toLocaleString()}`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Today: {stripeData ? stripeData.todayRevenueFormatted : '£0'}
          </div>
          {!settings.stripeConnected && (
            <span className="chip chip-amber" style={{ marginTop: 6, cursor: 'pointer' }} onClick={() => setPage('settings')}>Connect Stripe</span>
          )}
          {settings.stripeConnected && <span className="chip chip-green" style={{ marginTop: 6 }}>Live</span>}
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Bike size={13} color="var(--text3)" />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lyne MTB</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {goals.find(g => g.id === 'g2')?.currentValue ?? 14} orders
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Target: {settings.lyneSalesTarget} pre-orders
          </div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, ((goals.find(g => g.id === 'g2')?.currentValue ?? 14) / settings.lyneSalesTarget) * 100)}%`, background: '#0d9488' }} />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Goals</div>
        <button onClick={() => setPage('planner')} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
          View all <ChevronRight size={12} />
        </button>
      </div>
      <div className="card" style={{ padding: '12px 14px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.slice(0, 3).map(g => (
          <GoalProgress key={g.id} goal={g} onTap={() => { setSelectedGoalId(g.id); setPage('goal') }} />
        ))}
      </div>

      {/* Today's tasks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Today's tasks — {doneCount}/{totalToday} done
        </div>
        <button onClick={() => setPage('planner')} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="card" style={{ padding: '8px 14px', marginBottom: 16 }}>
        {prioritised.length === 0 && (
          <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>No tasks today — add some in Goals</div>
        )}
        {prioritised.map((task, i) => (
          <div key={task.id} onClick={() => toggleTask(task.id)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
            borderBottom: i < prioritised.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
          }}>
            {task.done
              ? <CheckCircle2 size={17} color="var(--green)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              : <Circle size={17} color={task.priority === 'high' ? 'var(--blue)' : 'var(--border2)'} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{task.title}</div>
              {task.estimatedMins && !task.done && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} />{task.estimatedMins}min
                </div>
              )}
            </div>
            <span className={`chip chip-${task.priority === 'high' ? 'blue' : task.priority === 'medium' ? 'amber' : 'gray'}`} style={{ flexShrink: 0 }}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
