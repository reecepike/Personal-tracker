import React, { useState } from 'react'
import { useApp } from '../App'
import { generateGoalPlan } from '../lib/planner'
import { format, differenceInDays } from 'date-fns'
import { ArrowLeft, Sparkles, Loader2, TrendingUp, Calendar, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

export default function GoalDetail() {
  const { goals, setGoals, tasks, setTasks, selectedGoalId, setPage } = useApp()
  const goal = goals.find(g => g.id === selectedGoalId)
  const [generating, setGenerating] = useState(false)

  if (!goal) { setPage('planner'); return null }

  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  const daysLeft = Math.max(0, differenceInDays(new Date(goal.deadline), new Date()))
  const colorMap = { blue: '#2563eb', teal: '#0d9488', green: '#16a34a', amber: '#d97706' }
  const color = colorMap[goal.color] || '#2563eb'
  const goalTasks = tasks.filter(t => t.goalId === goal.id)

  const regenerate = async () => {
    setGenerating(true)
    const plan = await generateGoalPlan(goal)
    if (plan) {
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, plan } : g))
      // Add generated tasks to task list
      if (plan.tasks) {
        const today = new Date().toISOString().split('T')[0]
        const newTasks = plan.tasks.map(t => ({
          id: 'gt' + Date.now() + Math.random(),
          title: t.title,
          description: t.description,
          priority: t.priority || 'medium',
          estimatedMins: t.estimatedMins || 30,
          goalId: goal.id,
          dueDate: today,
          done: false,
          category: t.category || 'work',
          frequency: t.frequency,
        }))
        setTasks(prev => [...prev.filter(t => t.goalId !== goal.id || prev.indexOf(t) < 0), ...newTasks])
      }
    }
    setGenerating(false)
  }

  const updateProgress = (val) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, currentValue: parseFloat(val) || 0 } : g))
  }

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setPage('planner')} style={{ padding: 6, color: 'var(--text2)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{goal.title}</h1>
      </div>

      {/* Progress card */}
      <div className="card" style={{ padding: '16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Progress</span>
          <span style={{ fontSize: 28, fontWeight: 700, color }}>{pct}%</span>
        </div>
        <div className="progress-track" style={{ height: 8, marginBottom: 12 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`chip chip-${daysLeft <= 7 ? 'red' : daysLeft <= 30 ? 'amber' : 'gray'}`}>
            <Calendar size={9} /> {daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
          </span>
          <span className="chip chip-gray">Deadline: {format(new Date(goal.deadline), 'd MMM yyyy')}</span>
        </div>

        {/* Update progress */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
            Update current value ({goal.unit})
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" defaultValue={goal.currentValue} id="progressInput"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }} />
            <button onClick={() => updateProgress(document.getElementById('progressInput').value)}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 500 }}>
              Update
            </button>
          </div>
        </div>
      </div>

      {/* AI Plan */}
      <div className="card" style={{ padding: '14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="var(--amber)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>AI Action Plan</span>
          </div>
          <button onClick={regenerate} disabled={generating}
            style={{ fontSize: 11, fontWeight: 500, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {generating ? <><Loader2 size={12} className="spinner" /> Generating...</> : '↺ Regenerate'}
          </button>
        </div>

        {!goal.plan && !generating && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>No plan yet</div>
            <button onClick={regenerate} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 500 }}>
              Generate plan
            </button>
          </div>
        )}

        {generating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--text3)' }}>
            <Loader2 size={16} className="spinner" />
            <span style={{ fontSize: 13 }}>Claude is building your plan...</span>
          </div>
        )}

        {goal.plan && !generating && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>{goal.plan.summary}</p>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily target</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{goal.plan.dailyTarget}</div>
            </div>
            {goal.plan.weeklyMilestones?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Milestones</div>
                {goal.plan.weeklyMilestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, background: 'var(--surface2)', padding: '1px 7px', borderRadius: 20, color: 'var(--text2)', flexShrink: 0, fontWeight: 500 }}>Wk {m.week}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.milestone}</span>
                  </div>
                ))}
              </div>
            )}
            {goal.plan.riskFactors?.length > 0 && (
              <div style={{ background: '#fffbeb', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <AlertTriangle size={11} color="var(--amber)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Watch out for</span>
                </div>
                {goal.plan.riskFactors.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#78350f', padding: '2px 0' }}>• {r}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linked tasks */}
      {goalTasks.length > 0 && (
        <div className="card" style={{ padding: '14px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Tasks ({goalTasks.filter(t => t.done).length}/{goalTasks.length} done)</div>
          {goalTasks.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: i < goalTasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button onClick={() => setTasks(prev => prev.map(tk => tk.id === t.id ? { ...tk, done: !tk.done } : tk))}>
                {t.done ? <CheckCircle2 size={16} color="var(--green)" /> : <Circle size={16} color="var(--border2)" />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.done ? 'var(--text3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                {t.estimatedMins && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.estimatedMins}min</div>}
              </div>
              <span className={`chip chip-${t.priority === 'high' ? 'blue' : 'gray'}`}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
