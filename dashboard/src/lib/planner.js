export async function generateGoalPlan(goal) {
  const today = new Date().toISOString().split('T')[0]
  const deadline = goal.deadline
  const daysLeft = Math.max(1, Math.round((new Date(deadline) - new Date(today)) / 86400000))

  const prompt = `You are a personal productivity coach. Break down this goal into a concrete daily action plan.

Goal: "${goal.title}"
Description: "${goal.description || 'No description'}"
Deadline: ${deadline} (${daysLeft} days from today: ${today})
Current progress: ${goal.currentValue || 0} / ${goal.targetValue || 100} ${goal.unit || ''}

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "summary": "one sentence summary of what needs to happen daily",
  "dailyTarget": "specific measurable thing to do each day",
  "weeklyMilestones": [
    { "week": 1, "milestone": "what should be achieved by end of week 1" },
    { "week": 2, "milestone": "what should be achieved by end of week 2" }
  ],
  "tasks": [
    { "id": "t1", "title": "task title", "description": "specific action", "frequency": "daily|weekly|once", "priority": "high|medium|low", "estimatedMins": 30, "category": "work|health|fitness|learning|other" }
  ],
  "riskFactors": ["potential obstacle 1", "potential obstacle 2"],
  "successMetric": "how you know you're on track daily"
}`

  try {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (!res.ok) throw new Error('Planner API error')
    const data = await res.json()
    return JSON.parse(data.content)
  } catch (err) {
    console.warn('Planner failed', err)
    return null
  }
}

export function prioritiseTasks(tasks, goals) {
  // Score tasks by: deadline urgency, priority weight, dependencies
  return [...tasks].sort((a, b) => {
    const urgencyA = getUrgencyScore(a, goals)
    const urgencyB = getUrgencyScore(b, goals)
    return urgencyB - urgencyA
  })
}

function getUrgencyScore(task, goals) {
  let score = 0
  const priorityWeights = { high: 30, medium: 20, low: 10 }
  score += priorityWeights[task.priority] || 10

  if (task.dueDate) {
    const daysLeft = Math.max(0, Math.round((new Date(task.dueDate) - Date.now()) / 86400000))
    if (daysLeft === 0) score += 50
    else if (daysLeft <= 1) score += 40
    else if (daysLeft <= 3) score += 25
    else if (daysLeft <= 7) score += 15
    else score += Math.max(0, 10 - daysLeft)
  }

  if (task.goalId) {
    const linkedGoal = goals.find(g => g.id === task.goalId)
    if (linkedGoal) {
      const pct = (linkedGoal.currentValue / linkedGoal.targetValue) * 100
      if (pct < 30) score += 15
    }
  }

  return score
}
