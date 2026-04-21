const STORAGE_KEY = 'weather-plan-storage'

function createEmptyStorage() {
  return {
    tradeSites: [],
    tradeUploads: {},
  }
}

function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText)
  } catch (error) {
    return null
  }
}

function normalizeStorage(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyStorage()
  }

  const tradeSites = Array.isArray(raw.tradeSites) ? raw.tradeSites : []
  const tradeUploads =
    raw.tradeUploads && typeof raw.tradeUploads === 'object' ? raw.tradeUploads : {}

  return {
    tradeSites,
    tradeUploads,
  }
}

export function loadWeatherPlanStorage() {
  if (typeof window === 'undefined') {
    return createEmptyStorage()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createEmptyStorage()
  }

  return normalizeStorage(safeParse(raw))
}

export function saveWeatherPlanStorage(payload) {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeStorage(payload)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
}

function parseDateText(dateText) {
  if (!dateText || typeof dateText !== 'string') {
    return null
  }

  const matched = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return null
  }

  return {
    y: Number(matched[1]),
    m: Number(matched[2]),
    d: Number(matched[3]),
  }
}

function isSameMonthPlan(plan, target) {
  return (
    plan &&
    Number(plan.y) === target.y &&
    Number(plan.m) === target.m &&
    Number.isFinite(Number(plan.d0)) &&
    Number.isFinite(Number(plan.d1))
  )
}

function isTargetIncluded(plan, targetDay) {
  const d0 = Math.min(Number(plan.d0), Number(plan.d1))
  const d1 = Math.max(Number(plan.d0), Number(plan.d1))
  return targetDay >= d0 && targetDay <= d1
}

export function getPlanSegmentsByDate(dateText) {
  const target = parseDateText(dateText)
  if (!target) {
    return []
  }

  const storage = loadWeatherPlanStorage()
  const tradeSites = Array.isArray(storage.tradeSites) ? storage.tradeSites : []
  const tradeUploads = storage.tradeUploads && typeof storage.tradeUploads === 'object'
    ? storage.tradeUploads
    : {}

  const tradeLabelMap = new Map(
    tradeSites.map((trade) => [trade.id, trade.label || trade.id]),
  )

  const result = []

  Object.entries(tradeUploads).forEach(([tradeId, uploads]) => {
    if (!Array.isArray(uploads)) return

    const tradeLabel = tradeLabelMap.get(tradeId) || tradeId

    uploads.forEach((upload, uploadIndex) => {
      const fileName = upload?.fileName || `upload-${uploadIndex + 1}`
      const segments = Array.isArray(upload?.segments) ? upload.segments : []

      segments.forEach((segment, segmentIndex) => {
        const plan = segment?.plan
        if (!isSameMonthPlan(plan, target)) return
        if (!isTargetIncluded(plan, target.d)) return

        result.push({
          id: `${tradeId}-${uploadIndex}-${segmentIndex}`,
          tradeId,
          tradeLabel,
          task: segment?.task || '계획 작업',
          source: fileName,
          planStart: Number(plan.d0),
          planEnd: Number(plan.d1),
          actual: segment?.actual || null,
        })
      })
    })
  })

  result.sort((a, b) => {
    if (a.planStart !== b.planStart) return a.planStart - b.planStart
    if (a.planEnd !== b.planEnd) return a.planEnd - b.planEnd
    return String(a.task).localeCompare(String(b.task), 'ko')
  })

  return result
}