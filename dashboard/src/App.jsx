import React, { useState, useEffect, createContext, useContext } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Dashboard from './components/Dashboard'
import Planner from './components/Planner'
import GoalDetail from './components/GoalDetail'
import Settings from './components/Settings'
import Nav from './components/Nav'
import GoogleAuthCallback from './components/GoogleAuthCallback'

export const AppContext = createContext(null)

const defaultGoals = [
  { id: 'g1', title: 'RP Web Studio — £5k MRR', description: 'Grow recurring revenue through new AI chatbot and phone agent clients', targetValue: 5000, currentValue: 2840, unit: '£', deadline: '2026-12-31', category: 'business', color: 'blue' },
  { id: 'g2', title: 'Lyne MTB — 100 pre-orders', description: 'Drive pre-orders for the Noir collection launch via Meta Ads', targetValue: 100, currentValue: 14, unit: 'orders', deadline: '2026-09-01', category: 'business', color: 'teal' },
  { id: 'g3', title: 'Ride 150km this month', description: 'MTB riding — trail sessions and endurance', targetValue: 150, currentValue: 62, unit: 'km', deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0], category: 'fitness', color: 'green' },
]

const defaultTasks = [
  { id: 'tk1', title: 'Review Oliviers Furniture ad creative', done: true, priority: 'high', category: 'work', goalId: null, dueDate: new Date().toISOString().split('T')[0], estimatedMins: 30 },
  { id: 'tk2', title: 'Post Lyne MTB launch reel', done: false, priority: 'high', category: 'work', goalId: 'g2', dueDate: new Date().toISOString().split('T')[0], estimatedMins: 20 },
  { id: 'tk3', title: 'MTB ride — 1 hour', done: false, priority: 'medium', category: 'fitness', goalId: 'g3', dueDate: new Date().toISOString().split('T')[0], estimatedMins: 60 },
  { id: 'tk4', title: 'Reply to 2 client enquiries', done: false, priority: 'high', category: 'work', goalId: 'g1', dueDate: new Date().toISOString().split('T')[0], estimatedMins: 20 },
  { id: 'tk5', title: 'Check Meta Ads spend — Oliviers', done: false, priority: 'medium', category: 'work', goalId: null, dueDate: new Date().toISOString().split('T')[0], estimatedMins: 15 },
]

const defaultHealth = {
  steps: 6420, stepsGoal: 10000,
  sleepHours: 7.2, sleepGoal: 8,
  calories: 2140, caloriesGoal: 2500,
  waterLitres: 1.6, waterGoal: 2.5,
  heartRate: 62, hrv: 54,
  workoutMins: 45, workoutGoal: 60,
  lastUpdated: null,
  source: 'manual',
}

export default function App() {
  const [page, setPage] = useState(() => {
    if (window.location.pathname.startsWith('/auth/google')) return 'auth'
    return 'dashboard'
  })
  const [goals, setGoals] = useLocalStorage('cmd_goals', defaultGoals)
  const [tasks, setTasks] = useLocalStorage('cmd_tasks', defaultTasks)
  const [health, setHealth] = useLocalStorage('cmd_health', defaultHealth)
  const [settings, setSettings] = useLocalStorage('cmd_settings', {
    name: 'Reece',
    stripeConnected: false,
    googleFitConnected: false,
    dailyRevenueTarget: 500,
    rpMRRTarget: 5000,
    lyneSalesTarget: 33,
  })
  const [stripeData, setStripeData] = useState(null)
  const [selectedGoalId, setSelectedGoalId] = useState(null)

  // Fetch Stripe data on mount if connected
  useEffect(() => {
    if (settings.stripeConnected) {
      import('./lib/stripe').then(({ fetchStripeData }) => {
        fetchStripeData().then(d => { if (d) setStripeData(d) })
      })
    }
  }, [settings.stripeConnected])

  const ctx = {
    page, setPage,
    goals, setGoals,
    tasks, setTasks,
    health, setHealth,
    settings, setSettings,
    stripeData, setStripeData,
    selectedGoalId, setSelectedGoalId,
  }

  if (page === 'auth') return <AppContext.Provider value={ctx}><GoogleAuthCallback /></AppContext.Provider>

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ minHeight: '100vh', paddingBottom: '72px' }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'planner' && <Planner />}
        {page === 'goal' && <GoalDetail />}
        {page === 'settings' && <Settings />}
        <Nav />
      </div>
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
