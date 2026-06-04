import React, { useState, useCallback } from 'react'
import { useApp } from '../App'
import { generateGoalPlan } from '../lib/planner'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import {
  Plus, Target, Calendar, Sparkles, ChevronRight, Trash2, X,
  CheckCircle2, Circle, Clock, Loader2, TrendingUp, AlertTriangle, ChevronLeft
} from 'lucide-react'

const COLORS = ['blue', 'teal', 'green', 'amber']
const CATEGORIES = ['business', 'fitness', 'health', 'learning', 'personal']

function AddGoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', description: '', targetValue: '', currentValue: 0,
    unit: '', deadline: '', category: 'business', color: 'blue'
  })
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    if (!form.title || !form.deadline) return
    setGenerating(true)
    const result = await generateGoalPlan({ ...form, targetValue: parseFloat(form.targetValue) || 100 })
    setPlan(result)
    setGenerating(false)
  }

  const save = () => {
    const id = 'g' + Date.now()
    const goal = {
      id,
      ...form,
      targetValue: parseFloat(form.targetValue) || 100,
      currentValue: parseFloat(form.currentValue) || 0,
      plan,
      createdAt: new Date().toISOString(),
    }
    onSave(goal)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '90vh', overflowY: 'auto',
        padding: '20px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>New goal</h2>
          <button onClick={onClose}><X size={20} color="var(--text2)" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Goal title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Reach £5k MRR" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="How will you achieve this?" style={{ ...inputStyle, height: 72, resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Current value</label>
              <input type="number" value={form.currentValue} onChange={e => set('currentValue', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target value</label>
              <input type="number" value={form.targetValue} onChange={e => set('targetValue', e.target.value)} placeholder="100" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Unit</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="£, orders, km..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Colour</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {COLORS.map(c => {
                  const colorMap = { blue: '#2563eb', teal: '#0d9488', green: '#16a34a', amber: '#d97706' }
                  return (
                    <button key={c} onClick={() => set('color', c)} style={{
                      width: 24, height: 24, borderRadius: '50%', background: colorMap[c],
                      border: form.color === c ? `2px solid var(--text)` : '2px solid transparent',
                      outline: form.color === c ? '2px solid var(--border)' : 'none',
                    }} />
                  )
                })}
              </div>
            </div>
          </div>

          {/* AI Plan */}
          {!plan && (
            <button onClick={generate} disabled={!form.title || !form.deadline || generating}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 10, border: '1px dashed var(--border2)',
                color: generating ? 'var(--text3)' : 'var(--text)', fontSize: 13, fontWeight: 500,
                background: 'var(--surface2)',
              }}>
              {generating ? <><Loader2 size={15} className="spinner" /> Generating AI plan...</> : <><Sparkles size={15} /> Generate daily action plan with AI</>}
            </button>
          )}

          {plan && (
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={13} color="var(--amber)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>AI Plan generated</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>{plan.summary}</p>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>Daily target:</div>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{plan.dailyTarget}</p>
              {plan.tasks?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>Key tasks ({plan.tasks.length}):</div>
                  {plan.tasks.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: 11, color: 'var(--text2)', padding: '3px 0' }}>• {t.title}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Cancel</button>
            <button onClick={save} disabled={!form.title || !form.deadline}
              style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              Save goal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ onClose, onSave, goals }) {
  const [form, setForm] = useState({
    title: '', priority: 'medium', estimatedMins: 30, goalId: '',
    dueDate: new Date().toISOString().split('T')[0], category: 'work',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    onSave({ id: 'tk' + Date.now(), ...form, done: false, estimatedMins: parseInt(form.estimatedMins) || 30 })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', width: '100%', padding: '20px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Add task</h2>
          <button onClick={onClose}><X size={20} color="var(--text2)" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Est. minutes</label>
              <input type="number" value={form.estimatedMins} onChange={e => set('estimatedMins', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Link to goal (optional)</label>
            <select value={form.goalId} onChange={e => set('goalId', e.target.value)} style={inputStyle}>
              <option value="">No goal</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Cancel</button>
            <button onClick={save} disabled={!form.title}
              style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              Add task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 11, fontWeight: 500, color: 'var(--text3)', display: 'block', marginBottom: 4 }
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'DM Sans, sans-serif',
}

export default function Planner() {
  const { goals, setGoals, tasks, setTasks } = useApp()
  const [view, setView] = useState('goals') // goals | calendar
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const addGoal = useCallback((g) => setGoals(prev => [...prev, g]), [setGoals])
  const removeGoal = useCallback((id) => setGoals(prev => prev.filter(g => g.id !== id)), [setGoals])
  const addTask = useCallback((t) => setTasks(prev => [...prev, t]), [setTasks])
  const toggleTask = useCallback((id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)), [setTasks])
  const removeTask = useCallback((id) => setTasks(prev => prev.filter(t => t.id !== id)), [setTasks])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const colorMap = { blue: '#2563eb', teal: '#0d9488', green: '#16a34a', amber: '#d97706' }

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Goals & Planner</h1>
        <button onClick={() => view === 'goals' ? setShowAddGoal(true) : setShowAddTask(true)}
          style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} />
        </button>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, marginBottom: 16, gap: 3 }}>
        {[['goals', 'Goals', Target], ['calendar', 'Calendar', Calendar]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: view === id ? 'var(--surface)' : 'transparent',
            color: view === id ? 'var(--text)' : 'var(--text3)',
            border: view === id ? '1px solid var(--border)' : '1px solid transparent',
            transition: 'all 0.15s',
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {view === 'goals' && (
        <div>
          {goals.length === 0 && (
            <div className="card" style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Target size={28} color="var(--text3)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>No goals yet</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Tap + to add your first goal</div>
            </div>
          )}
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
            const color = colorMap[goal.color] || '#2563eb'
            const daysLeft = Math.max(0, Math.round((new Date(goal.deadline) - Date.now()) / 86400000))
            const goalTasks = tasks.filter(t => t.goalId === goal.id)
            const doneTasks = goalTasks.filter(t => t.done).length
            return (
              <div key={goal.id} className="card fade-in" style={{ padding: '14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{goal.title}</div>
                    {goal.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{goal.description}</div>}
                  </div>
                  <button onClick={() => removeGoal(goal.id)} style={{ color: 'var(--text3)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {goal.unit === '£' ? `£${Number(goal.currentValue).toLocaleString()} / £${Number(goal.targetValue).toLocaleString()}` : `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`chip chip-${daysLeft <= 7 ? 'red' : daysLeft <= 30 ? 'amber' : 'gray'}`}>
                    {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                  </span>
                  <span className="chip chip-gray">{goal.category}</span>
                  {goalTasks.length > 0 && <span className="chip chip-blue">{doneTasks}/{goalTasks.length} tasks</span>}
                  {goal.plan && <span className="chip chip-teal"><Sparkles size={9} /> AI plan</span>}
                </div>
                {/* Tasks linked to this goal */}
                {goalTasks.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    {goalTasks.slice(0, 3).map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <button onClick={() => toggleTask(t.id)}>
                          {t.done ? <CheckCircle2 size={14} color="var(--green)" /> : <Circle size={14} color="var(--border2)" />}
                        </button>
                        <span style={{ fontSize: 12, color: t.done ? 'var(--text3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
                        <button onClick={() => removeTask(t.id)}><X size={11} color="var(--text3)" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'calendar' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ padding: 6, color: 'var(--text2)' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ padding: 6, color: 'var(--text2)' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date())
            const dayStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasks.filter(t => t.dueDate === dayStr)
            const done = dayTasks.filter(t => t.done).length
            return (
              <div key={dayStr} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: isToday ? 'var(--text)' : 'var(--surface2)',
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 600, color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text3)', textTransform: 'uppercase', lineHeight: 1 }}>{format(day, 'EEE')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : 'var(--text)', lineHeight: 1 }}>{format(day, 'd')}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {dayTasks.length === 0 ? 'No tasks' : `${done}/${dayTasks.length} done`}
                  </span>
                </div>
                {dayTasks.length > 0 && (
                  <div className="card" style={{ padding: '4px 12px', marginLeft: 38 }}>
                    {dayTasks.map((t, i) => (
                      <div key={t.id} onClick={() => toggleTask(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
                        borderBottom: i < dayTasks.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                      }}>
                        {t.done ? <CheckCircle2 size={14} color="var(--green)" /> : <Circle size={14} color={t.priority === 'high' ? 'var(--blue)' : 'var(--border2)'} />}
                        <span style={{ fontSize: 12, flex: 1, color: t.done ? 'var(--text3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                        <span className={`chip chip-${t.priority === 'high' ? 'blue' : t.priority === 'medium' ? 'amber' : 'gray'}`}>{t.priority}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onSave={addGoal} />}
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onSave={addTask} goals={goals} />}
    </div>
  )
}
