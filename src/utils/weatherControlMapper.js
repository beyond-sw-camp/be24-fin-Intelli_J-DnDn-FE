const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

//  날짜 유틸 
export function getTodayDateText() {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

//  강수확률 
export function calculateRainPercent(analysis, rain) {
  const fromAnalysis = analysis?.precipitationProbability
  if (fromAnalysis != null) return Number(fromAnalysis)
  const fromCard = Number(String(rain?.value || '').replace(/[^0-9]/g, ''))
  return Number.isFinite(fromCard) ? fromCard : 0
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

//  미세먼지 
export function getFineDustValue(analysis, airQuality) {
  return analysis?.fineDustValue ?? airQuality?.value ?? null
}

export function getFineDustLevelLabel(fineDustValue, airQuality) {
  if (fineDustValue == null) return airQuality?.label || 'API 미연동'
  if (fineDustValue <= 30) return '좋음'
  if (fineDustValue <= 80) return '보통'
  if (fineDustValue <= 150) return '나쁨'
  return '매우 나쁨 ⚠️'
}

export function getFineDustColor(fineDustValue) {
  if (fineDustValue == null) return 'border-slate-100 bg-slate-50'
  if (fineDustValue <= 30) return 'border-emerald-100/80 bg-gradient-to-br from-emerald-50 to-green-50'
  if (fineDustValue <= 80) return 'border-amber-100/80 bg-gradient-to-br from-amber-50 to-yellow-50'
  if (fineDustValue <= 150) return 'border-orange-200/80 bg-gradient-to-br from-orange-50 to-red-50'
  return 'border-rose-300/90 bg-gradient-to-br from-rose-100 to-red-100'
}

export function getFineDustValueColor(fineDustValue) {
  if (fineDustValue == null) return 'text-slate-700'
  if (fineDustValue <= 30) return 'text-emerald-800'
  if (fineDustValue <= 80) return 'text-amber-800'
  if (fineDustValue <= 150) return 'text-orange-900'
  return 'text-rose-900'
}

export function getFineDustIconColor(fineDustValue) {
  if (fineDustValue == null) return 'text-slate-400'
  if (fineDustValue <= 30) return 'text-emerald-500'
  if (fineDustValue <= 80) return 'text-amber-500'
  if (fineDustValue <= 150) return 'text-orange-600'
  return 'text-rose-600'
}

//  위험도 
export function normalizeRiskLevel(level) {
  if (level === '경고' || level === '제한' || level === '위험') return '위험'
  if (level === '주의') return '주의'
  return '안전/정상'
}

export function riskPriority(level) {
  const normalized = normalizeRiskLevel(level)
  if (normalized === '위험') return 0
  if (normalized === '주의') return 1
  return 2
}

export function levelBadgeClass(level) {
  const normalized = normalizeRiskLevel(level)
  if (normalized === '위험') return 'border border-rose-200 bg-rose-600 text-white shadow-sm'
  if (normalized === '주의') return 'border border-amber-200 bg-amber-100 text-amber-900'
  return 'border border-emerald-200 bg-emerald-100 text-emerald-900'
}

export function actionBadgeLabel(level) {
  const normalized = normalizeRiskLevel(level)
  if (normalized === '위험') return '즉시 확인'
  if (normalized === '주의') return '우선 조치'
  return '권장 조치'
}

export function cleanRiskTitle(title) {
  const baseTitle = String(title || '').trim()
  return baseTitle ? baseTitle.replace(/^\[[^\]]+\]\s*/, '') : '위험 항목'
}

//  즉시 조치 리스트 
export function generateLiveRiskActions(analysis, alerts) {
  if (!analysis) return []
  
  const actions = []
  const rain = analysis.precipitationProbability ?? 0
  const wind = analysis.maxWindSpeed ?? 0
  const fineDust = analysis.fineDustValue ?? 0
  const activeAlerts = alerts ?? []
  const nowHour = new Date().getHours()

  // 활성 특보
  activeAlerts.forEach((alert, i) => {
    actions.push({
      id: `alert-${i}`,
      label: '특보 활성 — 작업 책임자 즉시 공유',
      detail: alert.title || alert.message || '특보 내용 확인',
      level: alert.level || '경고',
      timing: '지금 즉시',
    })
  })

  // 풍속
  if (wind >= 10) {
    actions.push({
      id: 'wind-stop',
      label: '양중·고소 작업 일시 중지',
      detail: `현재 풍속 ${Number(wind).toFixed(1)}m/s · 풍속계 1시간 단위 재측정`,
      level: '경고',
      timing: '지금 즉시',
    })
  } else if (wind >= 8) {
    actions.push({
      id: 'wind-watch',
      label: '양중 신호수 추가 배치',
      detail: `풍속 ${Number(wind).toFixed(1)}m/s · 자재 결속 상태 점검`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  // 강수
  if (rain >= 70 || analysis.hasRain) {
    actions.push({
      id: 'rain-indoor',
      label: '외부 공정 → 실내 작업 전환',
      detail: `강수확률 ${rain}% · 타설/도장/방수 순연 검토`,
      level: '경고',
      timing: '오전 회의 시',
    })
  } else if (rain >= 40) {
    actions.push({
      id: 'rain-drain',
      label: '작업면 배수·미끄럼 점검',
      detail: `강수확률 ${rain}% · 통로/슬래브/경사로 확인`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  // 적설
  if (analysis.hasSnow) {
    actions.push({
      id: 'snow-clear',
      label: '제설·제빙 후 출입 동선 확보',
      detail: '경사 구간 장비 진입 통제, 안전화 미끄럼 방지 장구 지급',
      level: '경고',
      timing: '오전 출근 전',
    })
  }

  // 폭염
  if (analysis.heatRisk) {
    const isAfternoon = nowHour >= 12
    actions.push({
      id: 'heat',
      label: isAfternoon ? '폭염 시간대 옥외 작업 단축' : '12~14시 옥외 작업 휴식 편성',
      detail: `최고 ${analysis.maxTemperature ?? '--'}°C · 그늘막/얼음물 비치 점검`,
      level: '주의',
      timing: '12:00 ~ 14:00',
    })
  }

  // 한파
  if (analysis.coldRisk) {
    actions.push({
      id: 'cold',
      label: '저온 민감 공정 보양 점검',
      detail: `최저 ${analysis.minTemperature ?? '--'}°C · 콘크리트 양생/배관 동결 보호`,
      level: '주의',
      timing: '오전 작업 전',
    })
  }

  // 미세먼지
  if (analysis.fineDustRisk || fineDust >= 80) {
    actions.push({
      id: 'dust',
      label: 'KF94 보호구 지급 + 살수 빈도 강화',
      detail: `PM10 ${fineDust}㎍/㎥ · 옥외 도장/용접/절단 작업자 우선`,
      level: fineDust >= 150 ? '경고' : '주의',
      timing: '작업 시작 전',
    })
  }

  return actions
}

//  예보 데이터 
export function getThreeDayForecast(forecastDays) {
  const todayText = getTodayDateText()
  return forecastDays?.filter((d) => d.date && d.date >= todayText).slice(0, 3) || []
}

export function getWeeklyForecast(forecastDays) {
  const todayText = getTodayDateText()
  return forecastDays?.filter((d) => d.date && d.date >= todayText).slice(0, 7) || []
}

export function getMonthlyForecast(forecastDays) {
  if (!forecastDays || forecastDays.length === 0) return []

  const dayMap = new Map()
  forecastDays.forEach((d) => {
    if (d.date) dayMap.set(d.date, d)
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const getWeekStart = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    d.setDate(d.getDate() - d.getDay())
    return d
  }
  
  const formatMD = (date) => `${date.getMonth() + 1}/${date.getDate()}`
  const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  
  const thisWeekStart = getWeekStart(today)
  const weeks = []

  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(weekStart.getDate() + w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const effectiveStart = w === 0 && weekStart < today ? today : weekStart
    
    const days = []
    const cursor = new Date(effectiveStart)
    while (cursor <= weekEnd) {
      const key = dateKey(cursor)
      const source = dayMap.get(key)
      days.push({
        id: key,
        date: key,
        shortDate: formatMD(cursor),
        weekday: KOREAN_WEEKDAYS[cursor.getDay()],
        dayLabel: w === 0 && cursor.getDate() === today.getDate() ? '오늘' : KOREAN_WEEKDAYS[cursor.getDay()],
        weatherLabel: source?.weatherLabel || '예보 범위 외',
        maxTemp: source?.maxTemp ?? null,
        minTemp: source?.minTemp ?? null,
        precipitationProbability: source?.precipitationProbability ?? 0,
        windSpeed: source?.windSpeed ?? 0,
        hasData: Boolean(source),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    const dataDays = days.filter((d) => d.hasData)
    const validMax = dataDays.map((d) => d.maxTemp).filter((v) => v != null)
    const validMin = dataDays.map((d) => d.minTemp).filter((v) => v != null)
    const maxTemp = validMax.length ? Math.max(...validMax) : null
    const minTemp = validMin.length ? Math.min(...validMin) : null
    const avgRain = dataDays.length ? Math.round(dataDays.reduce((sum, d) => sum + d.precipitationProbability, 0) / dataDays.length) : 0
    const maxWind = dataDays.length ? Math.max(...dataDays.map((d) => d.windSpeed)) : 0

    let weatherSummary = '대체로 안정'
    const hasRainLabel = dataDays.some((d) => /비|소나기/.test(d.weatherLabel))
    const hasSnowLabel = dataDays.some((d) => /눈/.test(d.weatherLabel))
    if (!dataDays.length) weatherSummary = '예보 데이터 없음'
    else if (hasSnowLabel) weatherSummary = '적설 가능'
    else if (avgRain >= 60) weatherSummary = '비 예보 포함'
    else if (avgRain >= 40) weatherSummary = '흐린 날 있음'
    else if (hasRainLabel) weatherSummary = '강수 일부'

    const risk = !dataDays.length ? '정보 없음' : avgRain >= 60 || maxWind >= 10 ? '주의' : avgRain >= 40 || maxWind >= 8 ? '보통' : '양호'
    const riskClass = risk === '주의' ? 'text-rose-700 bg-rose-50 border-rose-200' : risk === '보통' ? 'text-amber-700 bg-amber-50 border-amber-200' : risk === '양호' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'

    weeks.push({
      id: `week-${dateKey(weekStart)}`,
      label: w === 0 ? '이번 주' : w === 1 ? '다음 주' : `${w + 1}주차`,
      dateRange: `${formatMD(effectiveStart)} — ${formatMD(weekEnd)}`,
      weatherSummary,
      maxTemp,
      minTemp,
      precipitationProbability: avgRain,
      windSpeed: maxWind,
      risk,
      riskClass,
      isCurrentWeek: w === 0,
      days,
    })
  }

  return weeks
}

// 포매팅 
export function weatherEmoji(label, rainPercent) {
  const k = String(label || '').replace(/\s/g, '')
  if (k.includes('눈')) return '❄️'
  if (k.includes('비') || rainPercent >= 70) return '🌧'
  if (k.includes('흐림') || k.includes('흐리고') || rainPercent >= 40) return '☁️'
  if (k.includes('강풍')) return '💨'
  if (k.includes('구름')) return '⛅'
  return '☀️'
}

export function formatWindSpeed(value) {
  if (value == null) return '-'
  const num = Number(value)
  return `${num.toFixed(num % 1 === 0 ? 0 : 1)}m/s`
}

export function getSourceLabel(sourceType) {
  const labels = {
    'KMA_FORECAST': { label: '기상청 단기예보', tone: 'text-sky-700 bg-sky-50 border-sky-200' },
    'KMA_MID': { label: '기상청 중기예보', tone: 'text-sky-700 bg-sky-50 border-sky-200' },
    'ASOS_DAILY': { label: '기상청 ASOS 실측', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    'DERIVED': { label: '추정값', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  }
  return labels[sourceType] || { label: '데이터 없음', tone: 'text-slate-600 bg-slate-50 border-slate-200' }
}