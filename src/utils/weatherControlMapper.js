const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const WEATHER_CONTROL_TEXT = {
  title: '기상 관제',
  desc: '기상 변화에 따른 위험 공정 통제와 작업 계획 조정 포인트를 한 화면에서 확인합니다.',
  catRisk: 'AI 위험 통제 추천',
  catRiskSub: '오늘 날씨와 작업 계획·중장비를 비교해 AI가 우선 검토 항목을 제안합니다.',
  row2Title: '위험 장비 통제',
  row3Title: '계획 대비 위험 경고',
  demoToday: '오늘 현장 요약',
  demoWeek: '기상 영향도',
  demoRain: '강수 확률',
  fineDustTitle: '금일 미세먼지',
  liveRisk: '현장 즉시 조치 체크리스트',
  liveRiskSub: '오늘 기상 기준 안전관리자가 지금 바로 진행해야 할 액션입니다.',
  tabWeek: '주간 7일',
  tabMonth: '월간',
}

export function getTodayDateText() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getSourceLabel(sourceType) {
  if (sourceType === 'KMA_FORECAST') return { label: '기상청 단기예보', tone: 'text-sky-700 bg-sky-50 border-sky-200' }
  if (sourceType === 'KMA_MID') return { label: '기상청 중기예보', tone: 'text-sky-700 bg-sky-50 border-sky-200' }
  if (sourceType === 'ASOS_DAILY') return { label: '기상청 ASOS 실측', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (sourceType === 'DERIVED') return { label: '추정값', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: '데이터 없음', tone: 'text-slate-600 bg-slate-50 border-slate-200' }
}

export function calculateRainPercent(analysis, rain) {
  const fromAnalysis = analysis?.precipitationProbability
  if (fromAnalysis != null) return Number(fromAnalysis)

  const fromCard = Number(String(rain?.value || '').replace(/[^0-9]/g, ''))
  return Number.isFinite(fromCard) ? fromCard : 0
}

export function getFineDustValue(analysis, airQuality) {
  return analysis?.fineDustValue ?? airQuality?.value ?? null
}

export function getWindTone(analysis) {
  const windSpeed = Number(analysis?.maxWindSpeed ?? 0)

  if (!analysis) {
    return {
      color: 'border-slate-100 bg-slate-50',
      iconColor: 'text-slate-400',
      textColor: 'text-slate-700',
      labelColor: 'text-slate-600',
      descriptionColor: 'text-slate-600',
      statusLabel: '정보 없음',
    }
  }

  if (windSpeed < 4) {
    return {
      color: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50',
      iconColor: 'text-violet-400',
      textColor: 'text-violet-700',
      labelColor: 'text-violet-500',
      descriptionColor: 'text-violet-600/80',
      statusLabel: '바람 약함',
    }
  }

  if (windSpeed < 8) {
    return {
      color: 'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100',
      iconColor: 'text-violet-500',
      textColor: 'text-violet-800',
      labelColor: 'text-violet-600',
      descriptionColor: 'text-violet-700/80',
      statusLabel: '작업 가능 풍속',
    }
  }

  if (windSpeed < 12) {
    return {
      color: 'border-violet-300 bg-gradient-to-br from-violet-100 to-fuchsia-100',
      iconColor: 'text-violet-700',
      textColor: 'text-violet-900',
      labelColor: 'text-violet-700',
      descriptionColor: 'text-violet-900/80',
      statusLabel: '양중 작업 주의',
    }
  }

  return {
    color: 'border-rose-200 bg-gradient-to-br from-rose-50 to-violet-100',
    iconColor: 'text-rose-600',
    textColor: 'text-rose-800',
    labelColor: 'text-rose-700',
    descriptionColor: 'text-rose-800/85',
    statusLabel: '강풍 통제 검토',
  }
}

export function getFineDustTone(fineDustValue, airQuality) {
  if (fineDustValue == null) {
    return {
      card: 'border-slate-100 bg-slate-50',
      icon: 'text-slate-400',
      value: 'text-slate-700',
      title: 'text-slate-700',
      desc: 'text-slate-600/80',
      label: airQuality?.label || 'API 미연동',
    }
  }

  if (fineDustValue <= 30) {
    return {
      card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50',
      icon: 'text-emerald-500',
      value: 'text-emerald-800',
      title: 'text-emerald-800',
      desc: 'text-emerald-700/80',
      label: '좋음',
    }
  }

  if (fineDustValue <= 80) {
    return {
      card: 'border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50',
      icon: 'text-amber-500',
      value: 'text-amber-800',
      title: 'text-amber-800',
      desc: 'text-amber-700/85',
      label: '보통',
    }
  }

  if (fineDustValue <= 150) {
    return {
      card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50',
      icon: 'text-orange-600',
      value: 'text-orange-800',
      title: 'text-orange-800',
      desc: 'text-orange-700/85',
      label: '나쁨',
    }
  }

  return {
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-red-100',
    icon: 'text-rose-600',
    value: 'text-rose-800',
    title: 'text-rose-800',
    desc: 'text-rose-700/85',
    label: '매우 나쁨',
  }
}

export function getRiskLevel(analysis) {
  if (!analysis) return { label: '데이터 없음', tone: 'text-slate-600 bg-slate-100 border-slate-200' }

  let score = 0
  if (analysis.hasRain || (analysis.precipitationProbability ?? 0) >= 60) score += 2
  if (analysis.windRisk || (analysis.maxWindSpeed ?? 0) >= 8) score += 2
  if (analysis.hasSnow) score += 2
  if (analysis.heatRisk) score += 1
  if (analysis.coldRisk) score += 1
  if (analysis.fineDustRisk) score += 1

  if (score >= 4) return { label: '높음', tone: 'text-rose-700 bg-rose-100 border-rose-200' }
  if (score >= 2) return { label: '보통', tone: 'text-amber-700 bg-amber-100 border-amber-200' }
  return { label: '낮음', tone: 'text-emerald-700 bg-emerald-100 border-emerald-200' }
}

export function normalizeText(value) {
  return String(value || '').toLowerCase()
}

export function includesAny(text, keywords) {
  const normalized = normalizeText(text)
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
}

export function normalizeRiskLevel(level, priority = null) {
  if (level === 'DANGER' || level === '위험' || level === '긴급' || priority === '긴급') return '경고'
  if (level === 'WARNING' || level === '경고' || level === '높음' || priority === '높음') return '경고'
  if (level === 'CAUTION' || level === '주의' || level === '보통' || priority === '보통') return '주의'
  if (level === 'SAFE' || level === '양호' || level === '낮음' || priority === '낮음') return '양호'
  return level || '주의'
}

export function isEquipmentRisk(risk) {
  const text = `${risk?.target || ''} ${risk?.reason || ''} ${risk?.recommendation || ''}`
  return includesAny(text, ['장비', '크레인', '타워', '고소작업차', '리프트', '굴착기', '덤프트럭', '트럭', '펌프카', '펌프', '지게차', '양중'])
}

export function cleanAiText(text) {
  return String(text || '')
    .replaceAll('콘크리 트', '콘크리트')
    .replaceAll('작 업', '작업')
    .replaceAll('작업 반장', '작업반장')
    .replaceAll('102 동', '102동')
    .replaceAll('103 동', '103동')
    .replaceAll('104 동', '104동')
    .replace(/실시한다\.?/g, '실시해 주세요.')
    .replace(/통제한다\.?/g, '통제해 주세요.')
    .replace(/점검한다\.?/g, '점검해 주세요.')
    .replace(/확인한다\.?/g, '확인해 주세요.')
    .replace(/결정한다\.?/g, '결정해 주세요.')
    .replace(/운영한다\.?/g, '운영해 주세요.')
    .replace(/이동한다\.?/g, '이동해 주세요.')
    .replace(/설치한다\.?/g, '설치해 주세요.')
    .replace(/공지한다\.?/g, '공지해 주세요.')
}

export function toWeatherRiskItem(risk) {
  const affectedWorks = Array.isArray(risk?.affectedWorks) ? risk.affectedWorks.filter(Boolean).map(cleanAiText) : []

  return {
    badge: 'AI',
    title: cleanAiText(risk?.target) || '기상 연동 위험 항목',
    subtitle: affectedWorks.join(', '),
    level: normalizeRiskLevel(risk?.level),
    reason: cleanAiText(risk?.reason) || '작업지시서와 금일 기상 조건을 비교해 위험 가능성이 감지되었습니다.',
    action: cleanAiText(risk?.recommendation) || '작업 전 안전관리자 검토가 필요합니다.',
  }
}

export function toLiveRiskAction(action, index) {
  const level = normalizeRiskLevel(action?.priority, action?.priority)

  return {
    id: `ai-action-${index}-${action?.action || 'weather'}`,
    icon: level === '경고' ? 'siren' : 'umbrella',
    label: cleanAiText(action?.action) || '현장 안전 조치 확인',
    detail: cleanAiText(action?.reason) || cleanAiText(action?.responsibleRole) || '금일 기상 기준으로 즉시 조치가 필요합니다.',
    level,
    timing: cleanAiText(action?.estimatedTime) || '작업 시작 전',
  }
}

export function mergeRiskItems(...groups) {
  const result = []
  const seen = new Set()

  groups.flat().filter(Boolean).forEach((item) => {
    const key = `${item.title || ''}-${item.reason || ''}`
    if (seen.has(key)) return
    seen.add(key)
    result.push(item)
  })

  return result
}

export function mergeLiveRiskActions(...groups) {
  const result = []
  const seen = new Set()

  groups.flat().filter(Boolean).forEach((item) => {
    const key = `${item.label || ''}-${item.detail || ''}`
    if (seen.has(key)) return
    seen.add(key)
    result.push(item)
  })

  return result
}

export function buildEquipmentRiskReason(equipment, cause) {
  const name = equipment.equipmentName || '중장비'
  const count = equipment.equipmentCount ?? 1
  const gateText = equipment.gateIdx != null ? `${equipment.gateIdx}번 게이트` : '게이트 미배정'
  return `${name} ${count}대가 ${gateText}로 투입 예정입니다. ${cause}`
}

export function buildEquipmentRisksFromWorkOrders(analysis, equipments) {
  if (!analysis || !equipments.length) return []

  const rain = analysis.precipitationProbability ?? 0
  const wind = analysis.maxWindSpeed ?? 0
  const fineDust = analysis.fineDustValue ?? 0
  const result = []

  equipments.forEach((equipment) => {
    const name = equipment.equipmentName || ''

    if (wind >= 8 && includesAny(name, ['크레인', '양중', '리프트', '고소', '붐', '타워'])) {
      result.push({
        badge: 'AI',
        title: `${name} 풍속 통제`,
        subtitle: equipment.workLocation || '작업구역 미지정',
        level: wind >= 10 ? '경고' : '주의',
        reason: buildEquipmentRiskReason(equipment, `현재 최대 풍속 ${Number(wind).toFixed(1)}m/s 기준으로 양중·고소 장비 흔들림 위험이 있습니다.`),
        action: '풍속 확인 후 투입, 신호수 추가 배치 또는 양중 순연을 검토해 주세요.',
      })
    }

    if ((analysis.hasRain || rain >= 60 || analysis.hasSnow) && includesAny(name, ['굴착', '덤프', '트럭', '펌프', '지게차', '카고', '로더'])) {
      result.push({
        badge: 'AI',
        title: `${name} 진입 동선 점검`,
        subtitle: equipment.workLocation || '작업구역 미지정',
        level: analysis.hasSnow || rain >= 70 ? '경고' : '주의',
        reason: buildEquipmentRiskReason(equipment, '강수·젖은 노면 조건에서는 장비 제동거리와 진입 동선 위험이 커집니다.'),
        action: '입차 전 노면·배수 확인, 경사 구간 통제 후 운행해 주세요.',
      })
    }

    if (fineDust >= 80 && includesAny(name, ['굴착', '절단', '연마', '덤프', '트럭', '천공'])) {
      result.push({
        badge: 'AI',
        title: `${name} 분진 저감 운용`,
        subtitle: equipment.workLocation || '작업구역 미지정',
        level: fineDust >= 150 ? '경고' : '주의',
        reason: buildEquipmentRiskReason(equipment, `PM10 ${fineDust}㎍/㎥ 조건에서 분진 발생 장비 운용 시 체감 농도가 높아질 수 있습니다.`),
        action: '살수 빈도 강화, 방진마스크 지급, 작업 시간 분산을 진행해 주세요.',
      })
    }
  })

  if (!result.length && equipments.length && (wind >= 10 || rain >= 70 || analysis.hasSnow)) {
    const first = equipments[0]
    result.push({
      badge: 'AI',
      title: '금일 장비 투입 전 안전 확인',
      subtitle: first.workLocation || '작업구역 미지정',
      level: '주의',
      reason: `금일 작업지시서에 ${equipments.length}건의 장비 투입이 있고, 기상 조건이 평시보다 불안정합니다.`,
      action: '게이트 입차 전 작업구역 노면·풍속·시야 상태를 재확인해 주세요.',
    })
  }

  return result.slice(0, 5)
}

export function buildPlanRisksFromWorkOrders(analysis, equipments) {
  if (!analysis || !equipments.length) return []

  const rain = analysis.precipitationProbability ?? 0
  const wind = analysis.maxWindSpeed ?? 0
  const fineDust = analysis.fineDustValue ?? 0
  const grouped = new Map()

  equipments.forEach((equipment) => {
    const key = equipment.workOrderIdx ?? `${equipment.workLocation}-${equipment.workDetail}`
    const previous = grouped.get(key) || {
      title: equipment.title || '작업 지시서',
      workLocation: equipment.workLocation || '작업구역 미지정',
      workDetail: equipment.workDetail || '',
      equipments: [],
    }
    previous.equipments.push(equipment.equipmentName)
    grouped.set(key, previous)
  })

  const result = []
  grouped.forEach((order) => {
    const targetText = `${order.title} ${order.workLocation} ${order.workDetail} ${order.equipments.join(' ')}`
    const equipmentText = order.equipments.filter(Boolean).join(', ') || '장비 미지정'

    if ((analysis.hasRain || rain >= 60) && includesAny(targetText, ['콘크리트', '타설', '도장', '방수', '외부', '굴착', '철근', '벽체'])) {
      result.push({
        badge: 'AI',
        title: `${order.workLocation} 우천 작업 재검토`,
        subtitle: order.title,
        level: rain >= 70 ? '경고' : '주의',
        reason: `작업상세내역 기준 ${equipmentText} 투입 예정이며, 강수확률 ${rain}%로 품질 저하와 미끄럼 위험이 있습니다.`,
        action: '실내 공정 전환, 타설·도장·방수 작업 시간 재조정을 검토해 주세요.',
      })
    }

    if (wind >= 8 && includesAny(targetText, ['양중', '철골', '패널', '유리', '외부', '고소', '비계', '크레인'])) {
      result.push({
        badge: 'AI',
        title: `${order.workLocation} 강풍 작업 통제`,
        subtitle: order.title,
        level: wind >= 10 ? '경고' : '주의',
        reason: `작업상세내역과 장비 목록에 강풍 영향 가능 작업이 포함되어 있고 최대 풍속은 ${Number(wind).toFixed(1)}m/s입니다.`,
        action: '양중·고소 작업 전 풍속 재측정, 신호수 추가 배치를 진행해 주세요.',
      })
    }

    if (fineDust >= 80 && includesAny(targetText, ['도장', '용접', '절단', '굴착', '외부', '연마'])) {
      result.push({
        badge: 'AI',
        title: `${order.workLocation} 분진 노출 관리`,
        subtitle: order.title,
        level: fineDust >= 150 ? '경고' : '주의',
        reason: `PM10 ${fineDust}㎍/㎥ 조건에서 옥외·분진 발생 작업이 예정되어 있습니다.`,
        action: '살수·차폐 강화, 보호구 지급, 작업 시간 분산을 진행해 주세요.',
      })
    }
  })

  return result.slice(0, 5)
}

export function generateLiveRiskActions(analysis, dashboard, aiLiveRiskActions, hasWorkOrders) {
  if (!hasWorkOrders) return []
  if (!analysis) return mergeLiveRiskActions(aiLiveRiskActions).slice(0, 6)

  const actions = []
  const rain = analysis.precipitationProbability ?? 0
  const wind = analysis.maxWindSpeed ?? 0
  const fineDust = analysis.fineDustValue ?? 0
  const alerts = dashboard?.alerts ?? []
  const nowHour = new Date().getHours()

  alerts.forEach((alert, index) => {
    actions.push({
      id: `alert-${index}`,
      icon: 'siren',
      label: '특보 활성 — 작업 책임자 즉시 공유',
      detail: alert.title || alert.message || '특보 내용 확인',
      level: alert.level || '경고',
      timing: '지금 즉시',
    })
  })

  if (wind >= 10) {
    actions.push({
      id: 'wind-stop',
      icon: 'wind',
      label: '양중·고소 작업 일시 중지 검토',
      detail: `현재 풍속 ${Number(wind).toFixed(1)}m/s · 풍속계 1시간 단위 재측정`,
      level: '경고',
      timing: '지금 즉시',
    })
  } else if (wind >= 8) {
    actions.push({
      id: 'wind-watch',
      icon: 'wind',
      label: '양중 신호수 추가 배치',
      detail: `풍속 ${Number(wind).toFixed(1)}m/s · 자재 결속 상태 점검`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  if (rain >= 70 || analysis.hasRain) {
    actions.push({
      id: 'rain-indoor',
      icon: 'umbrella',
      label: '외부 공정 실내 작업 전환 검토',
      detail: `강수확률 ${rain}% · 타설/도장/방수 순연 검토`,
      level: '경고',
      timing: '오전 회의 시',
    })
  } else if (rain >= 40) {
    actions.push({
      id: 'rain-drain',
      icon: 'umbrella',
      label: '작업면 배수·미끄럼 점검',
      detail: `강수확률 ${rain}% · 통로/슬래브/경사로 확인`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  if (analysis.hasSnow) {
    actions.push({
      id: 'snow-clear',
      icon: 'snow',
      label: '제설·제빙 후 출입 동선 확보',
      detail: '경사 구간 장비 진입 통제, 안전화 미끄럼 방지 장구 지급',
      level: '경고',
      timing: '오전 출근 전',
    })
  }

  if (analysis.heatRisk) {
    const isAfternoon = nowHour >= 12
    actions.push({
      id: 'heat',
      icon: 'sun',
      label: isAfternoon ? '폭염 시간대 옥외 작업 단축' : '12~14시 옥외 작업 휴식 편성',
      detail: `최고 ${analysis.maxTemperature ?? '--'}°C · 그늘막/얼음물 비치 점검`,
      level: '주의',
      timing: '12:00 ~ 14:00',
    })
  }

  if (analysis.coldRisk) {
    actions.push({
      id: 'cold',
      icon: 'thermometer',
      label: '저온 민감 공정 보양 점검',
      detail: `최저 ${analysis.minTemperature ?? '--'}°C · 콘크리트 양생/배관 동결 보호`,
      level: '주의',
      timing: '오전 작업 전',
    })
  }

  if (analysis.fineDustRisk || fineDust >= 80) {
    actions.push({
      id: 'dust',
      icon: 'mask',
      label: 'KF94 보호구 지급 + 살수 빈도 강화',
      detail: `PM10 ${fineDust}㎍/㎥ · 옥외 도장/용접/절단 작업자 우선`,
      level: fineDust >= 150 ? '경고' : '주의',
      timing: '작업 시작 전',
    })
  }

  return mergeLiveRiskActions(aiLiveRiskActions, actions).slice(0, 6)
}

export function getThreeDayForecast(forecastDays, selectedDateText) {
  return forecastDays
    .filter((day) => day.date && day.date >= selectedDateText)
    .slice(0, 3)
}

export function getWeeklyForecast(forecastDays, selectedDateText) {
  return forecastDays
    .filter((day) => day.date && day.date >= selectedDateText)
    .slice(0, 7)
}

function getWeekStart(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart
}

function formatMonthDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getMonthlyForecast(forecastDays, selectedDateText) {
  if (!forecastDays.length) return []

  const dayMap = new Map()
  forecastDays.forEach((day) => {
    if (day.date) dayMap.set(day.date, day)
  })

  const selectedDate = new Date(`${selectedDateText}T00:00:00`)
  const today = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
  const thisWeekStart = getWeekStart(today)
  const weeks = []

  for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(weekStart.getDate() + weekIndex * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const effectiveStart = weekIndex === 0 && weekStart < today ? today : weekStart
    const days = []
    const cursor = new Date(effectiveStart)

    while (cursor <= weekEnd) {
      const key = getDateKey(cursor)
      const source = dayMap.get(key)

      days.push({
        id: key,
        date: key,
        shortDate: formatMonthDate(cursor),
        weekday: KOREAN_WEEKDAYS[cursor.getDay()],
        dayLabel: weekIndex === 0 && getDateKey(cursor) === selectedDateText ? '기준일' : KOREAN_WEEKDAYS[cursor.getDay()],
        weatherLabel: source?.weatherLabel || '예보 범위 외',
        maxTemp: source?.maxTemp ?? null,
        minTemp: source?.minTemp ?? null,
        precipitationProbability: source?.precipitationProbability ?? 0,
        windSpeed: source?.windSpeed ?? 0,
        hasData: Boolean(source),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    const dataDays = days.filter((day) => day.hasData)
    const validMax = dataDays.map((day) => day.maxTemp).filter((value) => value != null)
    const validMin = dataDays.map((day) => day.minTemp).filter((value) => value != null)
    const maxTemp = validMax.length ? Math.max(...validMax) : null
    const minTemp = validMin.length ? Math.min(...validMin) : null
    const precipitationProbability = dataDays.length
      ? Math.round(dataDays.reduce((sum, day) => sum + day.precipitationProbability, 0) / dataDays.length)
      : 0
    const windSpeed = dataDays.length ? Math.max(...dataDays.map((day) => day.windSpeed)) : 0

    let weatherSummary = '대체로 안정'
    const hasRainLabel = dataDays.some((day) => /비|소나기/.test(day.weatherLabel))
    const hasSnowLabel = dataDays.some((day) => /눈/.test(day.weatherLabel))

    if (!dataDays.length) weatherSummary = '예보 데이터 없음'
    else if (hasSnowLabel) weatherSummary = '적설 가능'
    else if (precipitationProbability >= 60) weatherSummary = '비 예보 포함'
    else if (precipitationProbability >= 40) weatherSummary = '흐린 날 있음'
    else if (hasRainLabel) weatherSummary = '강수 일부'

    const risk = !dataDays.length
      ? '정보 없음'
      : precipitationProbability >= 60 || windSpeed >= 10
        ? '주의'
        : precipitationProbability >= 40 || windSpeed >= 8
          ? '보통'
          : '양호'
    const riskClass = risk === '주의'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : risk === '보통'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : risk === '양호'
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : 'text-slate-600 bg-slate-50 border-slate-200'

    weeks.push({
      id: `week-${getDateKey(weekStart)}`,
      label: weekIndex === 0 ? '이번 주' : weekIndex === 1 ? '다음 주' : `${weekIndex + 1}주차`,
      dateRange: `${formatMonthDate(effectiveStart)} — ${formatMonthDate(weekEnd)}`,
      weatherSummary,
      maxTemp,
      minTemp,
      precipitationProbability,
      windSpeed,
      risk,
      riskClass,
      isCurrentWeek: weekIndex === 0,
      days,
    })
  }

  return weeks
}

export function levelBadgeClass(level) {
  if (level === '경고' || level === '위험' || level === '제한') return 'bg-rose-600 text-white'
  if (level === '주의') return 'bg-amber-100 text-amber-900'
  return 'bg-emerald-100 text-emerald-900'
}

export function getRainBarClass(rainPercent) {
  if (rainPercent >= 80) return 'bg-gradient-to-r from-sky-500 to-blue-700 shadow-lg'
  if (rainPercent >= 70) return 'bg-gradient-to-r from-sky-450 to-blue-600 shadow-md'
  if (rainPercent >= 60) return 'bg-gradient-to-r from-sky-400 to-blue-600 shadow-md'
  if (rainPercent >= 40) return 'bg-gradient-to-r from-sky-300 to-blue-500 shadow-sm'
  if (rainPercent >= 20) return 'bg-gradient-to-r from-cyan-300 to-sky-400'
  return 'bg-gradient-to-r from-cyan-200 to-sky-300'
}

export function getRainNoteDetailed(rainPercent) {
  if (rainPercent >= 80) return '외부 공정 중단 및 배수 체계 가동'
  if (rainPercent >= 70) return '외부 공정 순연 검토 필요 · 배수 사전 점검'
  if (rainPercent >= 60) return '외부 작업 일정 재검토 · 용배수 준비'
  if (rainPercent >= 40) return '외부 작업면 상태 사전 점검 권장'
  if (rainPercent >= 20) return '기본 우천 대비 수준 유지'
  return '맑은 날씨로 정상 운영'
}

export function weatherEmoji(label, rainPercent) {
  const normalizedLabel = String(label || '').replace(/\s/g, '')

  if (normalizedLabel.includes('눈')) return '❄️'
  if (normalizedLabel.includes('비') || rainPercent >= 70) return '🌧'
  if (normalizedLabel.includes('흐림') || normalizedLabel.includes('흐리고') || rainPercent >= 40) return '☁️'
  if (normalizedLabel.includes('강풍')) return '💨'
  if (normalizedLabel.includes('구름')) return '⛅'
  return '☀️'
}

export function formatWindSpeed(value) {
  if (value == null) return '-'
  const numberValue = Number(value)
  return `${numberValue.toFixed(numberValue % 1 === 0 ? 0 : 1)}m/s`
}
