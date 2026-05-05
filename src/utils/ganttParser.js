// src/utils/ganttParser.js

/**
 * 기존 JSON 공정표 파일 형식 파싱 (사용처: 파일 직접 업로드 방식)
 */
export function parseGanttJSON(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  const rawList = Array.isArray(data) ? data : (data.공정목록 ?? [])
  if (!rawList.length) throw new Error('공정목록이 비어 있습니다.')

  let idSeq = 1
  const tasks = rawList.map((item) => ({
    id: idSeq++,
    checked: false,
    group: item.공사,
    sub: item.공사,
    name: item.공정,
    start: item.시작일,
    end: item.종료일,
    durDays: Math.round((new Date(item.종료일) - new Date(item.시작일)) / 86400000) + 1,
    prev: item.선행 ?? '',
    next: item.후속 ?? '',
    isCritical: item.CP ?? false,
    weight: item.보할 ?? null,
    confidence: 100,
    reviewStatus: '승인',
    location: '',
    responsible: '',
    requiredCount: 0,
    equipment: [],
    memo: '',
    sourceDocId: null,
  }))

  const nullItems = tasks.filter((t) => t.weight === null)
  const usedWeight = tasks.reduce((s, t) => s + (t.weight ?? 0), 0)
  const share = nullItems.length > 0 ? Math.floor((100 - usedWeight) / nullItems.length) : 0
  nullItems.forEach((t) => { t.weight = share })
  const gap = 100 - tasks.reduce((s, t) => s + t.weight, 0)
  if (gap > 0 && nullItems.length > 0) nullItems[nullItems.length - 1].weight += gap

  const proj = !Array.isArray(data) ? (data.프로젝트 ?? null) : null
  const startDate =
    proj?.시작일 ?? [...tasks].sort((a, b) => a.start.localeCompare(b.start))[0].start
  const endDate = proj?.종료일 ?? [...tasks].sort((a, b) => b.end.localeCompare(a.end))[0].end

  const projectInfo = {
    siteName: proj?.현장명 ?? '',
    projectName: proj?.이름 ?? '공정표',
    startDate,
    endDate,
    status: '검토 중',
    plannedProgress: 0,
    actualProgress: 0,
    totalTasks: tasks.length,
    cpTasks: tasks.filter((t) => t.isCritical).length,
    weightSum: tasks.reduce((s, t) => s + t.weight, 0),
    lastModified: new Date().toISOString().slice(0, 10),
    finalApprover: proj?.담당자 ?? '',
  }

  const rawMs = !Array.isArray(data) ? (data.마일스톤 ?? []) : []
  let milestones

  if (rawMs.length > 0) {
    milestones = rawMs.map((m, i) => ({
      id: i + 1,
      name: m.이름,
      date: m.날짜,
      group: m.공사 ?? _nearestGroup(m.날짜, tasks),
      relatedTask: _nearestTask(m.날짜, tasks, m.공사 ?? null),
      status: m.상태 ?? '예정',
      impact: m.영향도 ?? '중',
    }))
  } else {
    const groupLatest = new Map()
    tasks.forEach((t) => {
      if (!groupLatest.has(t.group) || t.end > groupLatest.get(t.group).end) {
        groupLatest.set(t.group, t)
      }
    })
    milestones = [...groupLatest.entries()].map(([group, t], i) => ({
      id: i + 1,
      name: `${group} 완료`,
      date: t.end,
      group,
      relatedTask: t.name,
      status: '예정',
      impact: t.isCritical ? '고' : '중',
    }))
  }

  const groupMap = new Map()
  tasks.forEach((t) => {
    if (!groupMap.has(t.group)) groupMap.set(t.group, [])
    groupMap.get(t.group).push(t)
  })
  const groupedTasks = [...groupMap.entries()].map(([group, items]) => ({ group, items }))

  return { projectInfo, tasks, milestones, groupedTasks }
}

function _nearestGroup(date, tasks) {
  return tasks.reduce((best, t) => {
    const d = Math.abs(new Date(t.end) - new Date(date))
    const bd = Math.abs(new Date(best.end) - new Date(date))
    return d < bd ? t : best
  }).group
}

function _nearestTask(date, tasks, group) {
  const pool = group ? tasks.filter((t) => t.group === group) : tasks
  return pool.reduce((best, t) => {
    const d = Math.abs(new Date(t.end) - new Date(date))
    const bd = Math.abs(new Date(best.end) - new Date(date))
    return d < bd ? t : best
  }).name
}

/**
 * 백엔드 TradeProcessDto.Res 목록 → 간트차트 형식 변환
 *
 * 변경 내용 (기존 WorkPlanDto.Res 필드명 → TradeProcessDto.Res 필드명):
 *  trade        → tradeName
 *  name         → processName
 *  startDate    → plannedStart
 *  endDate      → plannedEnd
 *  effectiveEnd → (제거, TradeProcess는 연장 없음)
 *  manager      → partnerCompany (협력사)
 *
 * ScheduleChartView.vue의 loadGanttFromApi()에서 사용됩니다.
 */
export function parseFromApi(apiList) {
  if (!apiList || apiList.length === 0) return { tasks: [], milestones: [], projectInfo: {} }

  let idSeq = 1
  const tasks = apiList
    .filter(item => item.plannedStart && item.plannedEnd)
    .map((item) => ({
      id: idSeq++,
      checked: false,
      group: item.tradeName ?? '기타',      // 공종 → 그룹
      sub: item.tradeName ?? '기타',
      name: item.processName ?? '(이름 없음)',
      start: item.plannedStart,
      end: item.plannedEnd,
      durDays: Math.round(
        (new Date(item.plannedEnd) - new Date(item.plannedStart)) / 86400000,
      ) + 1,
      prev: '',
      next: '',
      isCritical: false,
      weight: item.weightPct ?? 0,
      confidence: 100,
      reviewStatus: '승인',
      location: '',
      responsible: item.partnerCompany ?? '',
      requiredCount: 0,
      equipment: [],
      memo: '',
      isMilestone: item.isMilestone ?? false,
      sourceDocId: null,
    }))

  // 보할 미입력 항목 균등 배분
  const noWeight = tasks.filter((t) => !t.weight)
  const usedWeight = tasks.reduce((s, t) => s + (t.weight ?? 0), 0)
  if (noWeight.length > 0) {
    const share = Math.floor((100 - usedWeight) / noWeight.length)
    noWeight.forEach((t) => { t.weight = share })
    // 나머지 보정
    const gap = 100 - tasks.reduce((s, t) => s + t.weight, 0)
    if (gap > 0 && noWeight.length > 0) noWeight[noWeight.length - 1].weight += gap
  }

  if (tasks.length === 0) {
    return { tasks: [], milestones: [], projectInfo: {} }
  }

  const startDate = [...tasks].sort((a, b) => a.start.localeCompare(b.start))[0].start
  const endDate = [...tasks].sort((a, b) => b.end.localeCompare(a.end))[0].end

  const projectInfo = {
    projectName: '공정표',
    startDate,
    endDate,
    status: '검토 중',
    plannedProgress: 0,
    actualProgress: 0,
    totalTasks: tasks.length,
    cpTasks: 0,
    weightSum: tasks.reduce((s, t) => s + (t.weight ?? 0), 0),
    lastModified: new Date().toISOString().slice(0, 10),
    finalApprover: '',
  }

  // 마일스톤: isMilestone=true인 항목 우선, 없으면 공종별 마지막 날
  const milestoneItems = tasks.filter(t => t.isMilestone)
  let milestones

  if (milestoneItems.length > 0) {
    milestones = milestoneItems.map((t, i) => ({
      id: i + 1,
      name: t.name,
      date: t.end,
      group: t.group,
      relatedTask: t.name,
      status: '예정',
      impact: '중',
    }))
  } else {
    const groupLatest = new Map()
    tasks.forEach((t) => {
      if (!groupLatest.has(t.group) || t.end > groupLatest.get(t.group).end) {
        groupLatest.set(t.group, t)
      }
    })
    milestones = [...groupLatest.entries()].map(([group, t], i) => ({
      id: i + 1,
      name: `${group} 완료`,
      date: t.end,
      group,
      relatedTask: t.name,
      status: '예정',
      impact: '중',
    }))
  }

  return { tasks, milestones, projectInfo }
}
