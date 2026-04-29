<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  CalendarRange, CalendarClock, AlertTriangle, CheckCircle2, ShieldCheck,
  Upload, FileText, BrainCircuit, Pencil, X, Eye, Download, RefreshCw,
  ZoomIn, ZoomOut, Locate, Filter, Search, Plus, History, GitBranch,
  ChevronDown, ChevronRight, ChevronLeft, Flag, Target, FileWarning,
  ArrowRight, ThumbsUp, ThumbsDown, MessagesSquare, Layers, BarChart3,
  Clock, Users, Wrench, MapPin, Trash2,
} from 'lucide-vue-next'

// ======================================================
// MOCK DATA — 자체 완결 (별도 mockData.js 의존 없음)
// ======================================================
const projectInfo = ref({
  siteName: '강남 복합개발 1공구',
  projectName: '강남 복합개발 1공구 신축공사',
  startDate: '2025-03-01',
  endDate: '2026-09-30',
  status: '검토 중',         // 미등록 | AI 분석 중 | 검토 중 | 확정 | 변경 요청 중 | 변경 승인 완료
  plannedProgress: 62,
  actualProgress: 54,
  totalTasks: 10,
  cpTasks: 6,
  weightSum: 100,
  lastModified: '2026-04-15',
  finalApprover: '박현수 (현장 총책임자)',
})

// 권한 (데모용 — 셀렉터에서 변경 가능)
const ROLES = ['현장 총책임자', '공정 책임자', '본사 관리자', '일반 사용자']
const currentRole = ref('현장 총책임자')
const canConfirm = computed(() => currentRole.value === '현장 총책임자')
const canEdit = computed(() => ['현장 총책임자', '공정 책임자'].includes(currentRole.value))

// 업로드 문서
const uploadedDocs = ref([
  { id: 1, name: '마스터 공정표_v1.0.xlsx', type: '마스터 공정표', uploadedAt: '2026-04-01 09:12', uploadedBy: '박현수', aiAnalyzed: true,  reflectStatus: '반영 완료', desc: '전체 공정 마스터 일정' },
  { id: 2, name: '마일스톤_요약.pdf',       type: '마일스톤 공정표', uploadedAt: '2026-04-02 11:40', uploadedBy: '박현수', aiAnalyzed: true,  reflectStatus: '반영 완료', desc: '주요 마일스톤 일자' },
  { id: 3, name: '골조_시공계획서.pdf',     type: '공종별 시공계획서', uploadedAt: '2026-04-05 14:08', uploadedBy: '김지훈', aiAnalyzed: false, reflectStatus: '미반영',     desc: '골조 공종 상세 일정' },
])

// AI 분석 결과 — 기준 공정표 작업 목록
const aiTasks = ref([
  { id: 1, checked: false, group: '토목', sub: '터파기',     name: '터파기 및 흙막이', start: '2025-03-01', end: '2025-04-15', durDays: 46, prev: '',          next: '기초 콘크리트',    isCritical: true,  weight: 8,  confidence: 95, reviewStatus: '승인',
    location: '전 구역', responsible: '한토목', requiredCount: 8, equipment: ['굴삭기 2대', '덤프 4대'], memo: '흙막이 H-Pile 기준', sourceDocId: 1 },
  { id: 2, checked: false, group: '토목', sub: '기초',       name: '기초 콘크리트',    start: '2025-04-16', end: '2025-05-31', durDays: 46, prev: '터파기 및 흙막이', next: 'B3 ~ B1 골조',    isCritical: true,  weight: 10, confidence: 92, reviewStatus: '승인',
    location: '전 구역', responsible: '한토목', requiredCount: 10, equipment: ['펌프카 1대'], memo: '', sourceDocId: 1 },
  { id: 3, checked: false, group: '골조', sub: '지하 골조', name: 'B3 ~ B1 골조',    start: '2025-06-01', end: '2025-08-31', durDays: 92, prev: '기초 콘크리트',  next: '지상 1~5층 골조', isCritical: true,  weight: 15, confidence: 88, reviewStatus: '승인',
    location: 'B3~B1', responsible: '오반장', requiredCount: 15, equipment: ['타워크레인 1대'], memo: '', sourceDocId: 3 },
  { id: 4, checked: false, group: '골조', sub: '지상 골조', name: '지상 1~5층 골조',  start: '2025-09-01', end: '2025-11-30', durDays: 91, prev: 'B3 ~ B1 골조',   next: '지상 6~15층 골조', isCritical: true,  weight: 12, confidence: 90, reviewStatus: '수정 요청',
    location: '1~5F', responsible: '오반장', requiredCount: 14, equipment: ['타워크레인 1대'], memo: '5층 슬라브 보강 검토', sourceDocId: 3 },
  { id: 5, checked: false, group: '전기', sub: '간선',       name: '전기 간선 배관',   start: '2025-09-15', end: '2025-12-31', durDays: 108,prev: '',               next: '분전반 설치',     isCritical: false, weight: 6,  confidence: 82, reviewStatus: '검토 중',
    location: 'EPS', responsible: '정대리', requiredCount: 4, equipment: [], memo: '', sourceDocId: 1 },
  { id: 6, checked: false, group: '설비', sub: '급배수',     name: '급배수 배관',      start: '2025-10-01', end: '2026-02-28', durDays: 151,prev: '',               next: '소방 배관',       isCritical: false, weight: 7,  confidence: 85, reviewStatus: '검토 중',
    location: 'PS 전층', responsible: '서기술', requiredCount: 4, equipment: [], memo: '', sourceDocId: 1 },
  { id: 7, checked: false, group: '골조', sub: '지상 골조', name: '지상 6~15층 골조', start: '2025-12-01', end: '2026-03-31', durDays: 121,prev: '지상 1~5층 골조',next: '외벽 커튼월',     isCritical: true,  weight: 14, confidence: 78, reviewStatus: '미검토',
    location: '6~15F', responsible: '오반장', requiredCount: 16, equipment: ['타워크레인 1대'], memo: '', sourceDocId: 3 },
  { id: 8, checked: false, group: '마감', sub: '외장',       name: '외벽 커튼월',      start: '2026-02-01', end: '2026-06-30', durDays: 150,prev: '지상 6~15층 골조', next: '내부 마감 공사',  isCritical: false, weight: 10, confidence: 72, reviewStatus: '미검토',
    location: '전 외벽', responsible: '한현장', requiredCount: 8, equipment: ['고소차 2대'], memo: '저신뢰도 — 검토 필요', sourceDocId: 1 },
  { id: 9, checked: false, group: '마감', sub: '내장',       name: '내부 마감 공사',   start: '2026-04-01', end: '2026-08-31', durDays: 153,prev: '외벽 커튼월',     next: '준공 검사',       isCritical: false, weight: 11, confidence: 75, reviewStatus: '미검토',
    location: '전층 내부', responsible: '한현장', requiredCount: 10, equipment: [], memo: '', sourceDocId: 1 },
  { id:10, checked: false, group: '준공', sub: '준공 검사', name: '준공 검사 및 인수', start: '2026-08-01', end: '2026-09-30', durDays: 61, prev: '내부 마감 공사',  next: '',                isCritical: true,  weight: 7,  confidence: 80, reviewStatus: '미검토',
    location: '전 구역', responsible: '박현수', requiredCount: 3, equipment: [], memo: '', sourceDocId: 2 },
])

// 마일스톤
const milestones = ref([
  { id: 1, name: '착공',         date: '2025-03-01', relatedTask: '터파기 및 흙막이',  status: '완료',     impact: '저' },
  { id: 2, name: '토공 완료',    date: '2025-05-31', relatedTask: '기초 콘크리트',     status: '완료',     impact: '중' },
  { id: 3, name: '골조 완료',    date: '2026-03-31', relatedTask: '지상 6~15층 골조',  status: '지연 위험', impact: '고' },
  { id: 4, name: '외장 완료',    date: '2026-06-30', relatedTask: '외벽 커튼월',       status: '예정',     impact: '중' },
  { id: 5, name: '마감 완료',    date: '2026-08-31', relatedTask: '내부 마감 공사',    status: '예정',     impact: '중' },
  { id: 6, name: '사용승인',     date: '2026-09-15', relatedTask: '준공 검사 및 인수', status: '예정',     impact: '고' },
  { id: 7, name: '준공',         date: '2026-09-30', relatedTask: '준공 검사 및 인수', status: '예정',     impact: '고' },
])

// 변경 요청 (확정 후 발생)
const changeRequests = ref([
  { id: 1, requestedAt: '2026-04-22', taskId: 7, taskName: '지상 6~15층 골조', group: '골조',
    changeType: '기간 연장', oldStart: '2025-12-01', oldEnd: '2026-03-31', newStart: '2025-12-01', newEnd: '2026-04-07',
    oldCp: true, newCp: true, oldWeight: 14, newWeight: 14, oldPrev: '지상 1~5층 골조', newPrev: '지상 1~5층 골조',
    requester: '오반장', reason: '골조 콘크리트 양생 지연 — 7일 연장 필요',
    affectedTasks: ['외벽 커튼월', '내부 마감 공사'], milestoneImpact: '골조 완료 마일스톤 7일 지연',
    cpImpact: true, expectedDelayDays: 7,
    aiSummary: '본 작업은 CP 공정으로, 7일 연장 시 후속 작업인 외벽 커튼월과 골조 완료 마일스톤이 동일 기간 지연됩니다. 외장 완료 마일스톤도 영향권에 들어갈 수 있어 현장 총책임자 승인 권장.',
    status: '검토 중', approver: '', approvedAt: '' },
  { id: 2, requestedAt: '2026-04-25', taskId: 5, taskName: '전기 간선 배관', group: '전기',
    changeType: '시작일 변경', oldStart: '2025-09-15', oldEnd: '2025-12-31', newStart: '2025-10-01', newEnd: '2026-01-15',
    oldCp: false, newCp: false, oldWeight: 6, newWeight: 6, oldPrev: '', newPrev: 'B3 ~ B1 골조',
    requester: '정대리', reason: '골조 진행 일정에 맞춰 착수 시점 조정',
    affectedTasks: ['분전반 설치'], milestoneImpact: '없음',
    cpImpact: false, expectedDelayDays: 0,
    aiSummary: 'CP 공정 아니며, 후속 작업과의 여유 기간 내에서 조정 가능. 마일스톤 영향 없음.',
    status: '요청됨', approver: '', approvedAt: '' },
  { id: 3, requestedAt: '2026-04-18', taskId: 4, taskName: '지상 1~5층 골조', group: '골조',
    changeType: '보할 변경', oldStart: '2025-09-01', oldEnd: '2025-11-30', newStart: '2025-09-01', newEnd: '2025-11-30',
    oldCp: true, newCp: true, oldWeight: 12, newWeight: 14, oldPrev: 'B3 ~ B1 골조', newPrev: 'B3 ~ B1 골조',
    requester: '오반장', reason: '실 공사 물량 재산정 결과 보할 상향 조정',
    affectedTasks: [], milestoneImpact: '없음',
    cpImpact: false, expectedDelayDays: 0,
    aiSummary: '보할 합계 변동 없음 (다른 작업에서 -2% 조정 필요). 일정 영향 없음.',
    status: '반영 완료', approver: '박현수', approvedAt: '2026-04-19' },
])

// 변경 이력
const changeLog = ref([
  { id: 1, at: '2026-04-19 14:22', who: '박현수', action: '승인', target: '지상 1~5층 골조', detail: '보할 12% → 14%' },
  { id: 2, at: '2026-04-15 09:30', who: '박현수', action: '확정 보류', target: '기준 공정표 v1', detail: '미검토 4건 잔존' },
  { id: 3, at: '2026-04-01 09:12', who: '박현수', action: '문서 등록', target: '마스터 공정표 v1.0', detail: 'AI 분석 시작' },
])

// ======================================================
// 상태/UI 토글
// ======================================================
const ganttScale = ref('month')      // year | month | week
const ganttZoom = ref(1)             // 0.6 ~ 1.6
const onlyCp = ref(false)
const onlyMilestone = ref(false)
const highlightDelayed = ref(true)
const groupOpen = ref({ 토목: true, 골조: true, 전기: true, 설비: true, 마감: true, 준공: true })

const filterGroup = ref('')
const filterReview = ref('')
const filterCp = ref('')
const searchKey = ref('')

const selectedTaskId = ref(null)
const selectedTask = computed(() => aiTasks.value.find(t => t.id === selectedTaskId.value) ?? null)

// 모달
const editModalOpen = ref(false)
const editForm = ref(null)
const confirmModalOpen = ref(false)
const changeModalOpen = ref(false)
const changeRequestFormOpen = ref(false)
const newChangeReq = ref(null)
const selectedChangeId = ref(null)
const selectedChange = computed(() => changeRequests.value.find(c => c.id === selectedChangeId.value) ?? null)

// 업로드 폼
const uploadForm = ref({ docType: '마스터 공정표', desc: '', fileName: '' })
const aiAnalyzing = ref(false)

// ======================================================
// 헬퍼
// ======================================================
const isConfirmed = computed(() => ['확정', '변경 요청 중', '변경 승인 완료'].includes(projectInfo.value.status))

const reviewStatusClass = (s) => ({
  '승인':     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '미검토':   'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  '검토 중':  'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  '수정 요청':'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '제외':     'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}[s] ?? 'bg-slate-100 text-slate-500')

const docStatusClass = (s) => ({
  '미등록':       'bg-slate-100 text-slate-500',
  'AI 분석 중':   'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  '검토 중':      'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '확정':         'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '변경 요청 중': 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
  '변경 승인 완료':'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}[projectInfo.value.status] ?? 'bg-slate-100 text-slate-500')

const milestoneStatusClass = (s) => ({
  '예정':     'bg-slate-100 text-slate-500',
  '정상':     'bg-emerald-50 text-emerald-700',
  '지연 위험': 'bg-rose-50 text-rose-700',
  '완료':     'bg-flare-50 text-flare-700',
}[s] ?? 'bg-slate-100')

const crStatusClass = (s) => ({
  '요청됨':    'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  '검토 중':   'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '승인':      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '반려':      'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  '반영 완료': 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
}[s] ?? 'bg-slate-100')

const confidenceClass = (n) =>
    n >= 90 ? 'text-emerald-600' : n >= 80 ? 'text-forena-600' : 'text-amber-600'

// 필터링된 작업 (테이블/간트차트 공용)
const filteredTasks = computed(() => {
  let r = aiTasks.value
  if (filterGroup.value)  r = r.filter(t => t.group === filterGroup.value)
  if (filterReview.value) r = r.filter(t => t.reviewStatus === filterReview.value)
  if (filterCp.value === 'cp')    r = r.filter(t => t.isCritical)
  if (filterCp.value === 'noncp') r = r.filter(t => !t.isCritical)
  if (onlyCp.value)        r = r.filter(t => t.isCritical)
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase()
    r = r.filter(t =>
        t.name.toLowerCase().includes(k) ||
        t.group.toLowerCase().includes(k) ||
        t.sub.toLowerCase().includes(k))
  }
  return r
})

// 공종 그룹별 묶기
const groupedTasks = computed(() => {
  const map = new Map()
  for (const t of filteredTasks.value) {
    if (!map.has(t.group)) map.set(t.group, [])
    map.get(t.group).push(t)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
})

// 진척률 - 공종별
const groupProgress = computed(() => {
  const sums = {}
  for (const t of aiTasks.value) {
    if (!sums[t.group]) sums[t.group] = { plan: 0, actual: 0, count: 0 }
    sums[t.group].plan += t.weight
    sums[t.group].actual += t.weight * 0.85   // 데모용 — 실제 진척
    sums[t.group].count += 1
  }
  return Object.entries(sums).map(([g, v]) => ({
    group: g,
    plan: Math.round(v.plan / aiTasks.value.length * 10) / 10,
    actual: Math.round(v.actual / aiTasks.value.length * 10) / 10,
    diff: Math.round((v.actual - v.plan) / aiTasks.value.length * 10) / 10,
  }))
})

// 검증 (확정 전 / 후 모두 화면에 노출)
const validation = computed(() => {
  const issues = []
  const unreviewed = aiTasks.value.filter(t => t.reviewStatus === '미검토').length
  if (unreviewed) issues.push({ level: 'warn', msg: `미검토 항목이 ${unreviewed}건 있습니다.` })

  const noDate = aiTasks.value.filter(t => !t.start || !t.end).length
  if (noDate) issues.push({ level: 'error', msg: `시작일/종료일 누락 작업이 ${noDate}건 있습니다.` })

  const reverse = aiTasks.value.filter(t => t.start && t.end && t.start > t.end).length
  if (reverse) issues.push({ level: 'error', msg: `시작일이 종료일보다 늦은 작업이 ${reverse}건 있습니다.` })

  const wsum = aiTasks.value.reduce((a, t) => a + (Number(t.weight) || 0), 0)
  if (wsum !== 100) issues.push({ level: 'warn', msg: `보할 합계가 ${wsum}% 입니다 (100% 권장).` })

  const lowConf = aiTasks.value.filter(t => t.confidence < 80).length
  if (lowConf) issues.push({ level: 'info', msg: `AI 신뢰도 80% 미만 항목이 ${lowConf}건 있습니다.` })

  const noLink = aiTasks.value.filter(t => !t.prev && !t.next).length
  if (noLink) issues.push({ level: 'info', msg: `선행/후속 작업이 모두 누락된 항목이 ${noLink}건 있습니다.` })

  const pendingChanges = changeRequests.value.filter(c => ['요청됨','검토 중'].includes(c.status)).length
  if (pendingChanges) issues.push({ level: 'warn', msg: `확정된 공정표에 변경 요청 ${pendingChanges}건이 대기 중입니다.` })

  return issues
})

const validationCounts = computed(() => ({
  unreviewed: aiTasks.value.filter(t => t.reviewStatus === '미검토').length,
  pendingChanges: changeRequests.value.filter(c => ['요청됨','검토 중'].includes(c.status)).length,
  weightSum: aiTasks.value.reduce((a, t) => a + (Number(t.weight) || 0), 0),
}))

// ======================================================
// 간트차트 — 라인형
// ======================================================
const projStart = computed(() => projectInfo.value.startDate)
const projEnd = computed(() => projectInfo.value.endDate)
const projTotalDays = computed(() => {
  const a = new Date(projStart.value), b = new Date(projEnd.value)
  return Math.round((b - a) / 86400000) + 1
})
function dayOffset(dateStr) {
  const a = new Date(projStart.value), b = new Date(dateStr)
  return Math.max(0, Math.round((b - a) / 86400000))
}
function rangeDays(s, e) {
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000) + 1)
}

// 스케일별 셀 너비(px)
const cellW = computed(() => {
  const base = ganttScale.value === 'year' ? 1.2 : ganttScale.value === 'month' ? 3 : 14
  return base * ganttZoom.value
})
const ganttPxWidth = computed(() => projTotalDays.value * cellW.value)

// 헤더 라벨 — year(분기), month(월), week(주)
const ganttHeader = computed(() => {
  const out = []
  const a = new Date(projStart.value)
  const total = projTotalDays.value
  if (ganttScale.value === 'year') {
    // 분기 단위
    let y = a.getFullYear(), q = Math.floor(a.getMonth() / 3) + 1
    let cursor = new Date(a)
    while (cursor < new Date(projEnd.value)) {
      const qStart = new Date(y, (q - 1) * 3, 1)
      const qEndMonth = (q - 1) * 3 + 3
      const qEnd = new Date(y, qEndMonth, 0)
      const start = qStart < a ? a : qStart
      const end = qEnd > new Date(projEnd.value) ? new Date(projEnd.value) : qEnd
      out.push({ label: `${y}년 ${q}Q`, days: Math.round((end - start) / 86400000) + 1 })
      q += 1; if (q > 4) { q = 1; y += 1 }
      cursor = new Date(y, (q - 1) * 3, 1)
    }
  } else if (ganttScale.value === 'month') {
    let cur = new Date(a.getFullYear(), a.getMonth(), 1)
    const last = new Date(projEnd.value)
    while (cur <= last) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const start = cur < a ? a : cur
      const end = next > last ? last : next
      out.push({ label: `${cur.getFullYear()}.${String(cur.getMonth() + 1).padStart(2, '0')}`, days: Math.round((end - start) / 86400000) + 1 })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  } else {
    // 주간 — 7일씩
    let cursor = new Date(a)
    let weekIdx = 1
    while (cursor <= new Date(projEnd.value)) {
      const next = new Date(cursor); next.setDate(next.getDate() + 7)
      const end = next > new Date(projEnd.value) ? new Date(projEnd.value) : next
      out.push({ label: `${weekIdx}주`, days: Math.round((end - cursor) / 86400000) + 1 })
      cursor = next; weekIdx += 1
      if (weekIdx > 200) break // 안전장치
    }
  }
  return out
})

// 막대 위치 계산
function barStyle(start, end) {
  if (!start || !end) return null
  const left = dayOffset(start) * cellW.value
  const width = rangeDays(start, end) * cellW.value
  return { left: `${left}px`, width: `${width - 4}px` }
}

// 오늘 라인
const todayLineStyle = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  if (today < projStart.value || today > projEnd.value) return null
  return { left: `${dayOffset(today) * cellW.value + cellW.value / 2}px` }
})

// 마일스톤 마커 위치
function milestoneStyle(date) {
  return { left: `${dayOffset(date) * cellW.value + cellW.value / 2 - 6}px` }
}

// 지연 작업 판단 (데모용 — 보할 진척과 오늘 비교)
function isDelayed(task) {
  const today = new Date().toISOString().slice(0, 10)
  return task.start <= today && task.end >= today && task.confidence < 85
}

// ======================================================
// 액션 핸들러 — 모두 mock
// ======================================================
function onUploadFile(e) {
  const f = e.target.files?.[0]
  if (f) uploadForm.value.fileName = f.name
  e.target.value = ''
}
function runAiAnalysis() {
  if (!uploadForm.value.fileName) {
    alert('파일을 먼저 업로드하세요.')
    return
  }
  aiAnalyzing.value = true
  projectInfo.value.status = 'AI 분석 중'
  setTimeout(() => {
    aiAnalyzing.value = false
    projectInfo.value.status = '검토 중'
    uploadedDocs.value.unshift({
      id: Date.now(), name: uploadForm.value.fileName, type: uploadForm.value.docType,
      uploadedAt: new Date().toLocaleString('ko-KR'), uploadedBy: '관리자',
      aiAnalyzed: true, reflectStatus: '검토 중', desc: uploadForm.value.desc,
    })
    uploadForm.value = { docType: '마스터 공정표', desc: '', fileName: '' }
    alert('AI 분석이 완료되었습니다. 분석 결과를 검토하세요.')
  }, 1400)
}
function loadExistingDoc() { alert('기존 문서 불러오기 (데모)') }
function manualInput() { alert('직접 입력 모드 (데모)') }
function reanalyze(docId) {
  const doc = uploadedDocs.value.find(d => d.id === docId)
  if (doc) { doc.reflectStatus = '검토 중'; alert(`"${doc.name}" 재분석 시작 (데모)`) }
}
function viewDoc(doc) { alert(`원본 문서 보기: ${doc.name} (데모)`) }
function downloadDoc(doc) { alert(`다운로드: ${doc.name} (데모)`) }

// 검토 상태 빠른 변경
function setReview(task, status) { task.reviewStatus = status }
// 검증 경고 갯수에 따라 한 줄에 몇 개할지 설정
const gridClass = computed(() => {
  const count = validation.value.length;

  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  // 4개 이상일 때는 무조건 4열로 고정 (나머지는 다음 줄로 넘어감)
  return 'grid-cols-4';
});

// 일괄 처리
function bulkApprove() {
  aiTasks.value.forEach(t => { if (t.checked) t.reviewStatus = '승인' })
  aiTasks.value.forEach(t => t.checked = false)
}
function bulkExclude() {
  aiTasks.value.forEach(t => { if (t.checked) t.reviewStatus = '제외' })
  aiTasks.value.forEach(t => t.checked = false)
}

// 수정 모달
function openEdit(task) {
  if (isConfirmed.value) {
    // 확정 후에는 변경 요청 모달
    openChangeRequestForm(task)
    return
  }
  editForm.value = JSON.parse(JSON.stringify(task))
  editForm.value._original = JSON.parse(JSON.stringify(task)) // 변경 비교용
  editModalOpen.value = true
}
function saveEdit() {
  const idx = aiTasks.value.findIndex(t => t.id === editForm.value.id)
  if (idx !== -1) {
    const { _original, ...payload } = editForm.value
    Object.assign(aiTasks.value[idx], payload)
    aiTasks.value[idx].reviewStatus = '검토 중'
  }
  editModalOpen.value = false
  editForm.value = null
}

// 기준 공정표 확정
function openConfirm() {
  if (!canConfirm.value) { alert('기준 공정표 확정 권한이 없습니다.'); return }
  confirmModalOpen.value = true
}
function confirmBaseline() {
  projectInfo.value.status = '확정'
  projectInfo.value.lastModified = new Date().toISOString().slice(0, 10)
  changeLog.value.unshift({
    id: Date.now(), at: new Date().toLocaleString('ko-KR'),
    who: '박현수', action: '기준 공정표 확정', target: `v${changeLog.value.length + 1}`,
    detail: `전체 ${aiTasks.value.length}건 / CP ${aiTasks.value.filter(t=>t.isCritical).length}건`,
  })
  confirmModalOpen.value = false
  alert('기준 공정표가 확정되었습니다. 이후 수정은 변경 요청을 통해 처리됩니다.')
}

// 변경 요청
function openChangeManagement() { changeModalOpen.value = true }
function openChangeRequestForm(task) {
  newChangeReq.value = {
    taskId: task.id, taskName: task.name, group: task.group,
    changeType: '시작일 변경',
    oldStart: task.start, oldEnd: task.end,
    newStart: task.start, newEnd: task.end,
    oldCp: task.isCritical, newCp: task.isCritical,
    oldWeight: task.weight, newWeight: task.weight,
    oldPrev: task.prev, newPrev: task.prev,
    reason: '',
  }
  changeRequestFormOpen.value = true
}
function submitChangeRequest() {
  if (!newChangeReq.value.reason.trim()) { alert('변경 사유를 입력하세요.'); return }
  const cp = newChangeReq.value.oldCp || newChangeReq.value.newCp
  const delayDays = Math.max(0, Math.round(
      (new Date(newChangeReq.value.newEnd) - new Date(newChangeReq.value.oldEnd)) / 86400000
  ))
  changeRequests.value.unshift({
    id: Date.now(),
    requestedAt: new Date().toISOString().slice(0, 10),
    ...newChangeReq.value,
    requester: currentRole.value === '공정 책임자' ? '오반장' : '관리자',
    affectedTasks: [],
    milestoneImpact: cp ? '관련 마일스톤 영향 가능' : '없음',
    cpImpact: cp,
    expectedDelayDays: delayDays,
    aiSummary: cp
        ? `CP 공정 변경 요청. ${delayDays}일 지연 시 후속 작업과 마일스톤에 영향 가능. 현장 총책임자 승인 권장.`
        : `비CP 공정. 일정 영향 제한적.`,
    status: '요청됨', approver: '', approvedAt: '',
  })
  projectInfo.value.status = '변경 요청 중'
  changeRequestFormOpen.value = false
  alert('변경 요청이 등록되었습니다.')
}
function approveChange(cr) {
  if (!canConfirm.value) { alert('변경 승인 권한이 없습니다.'); return }
  cr.status = '승인'
  cr.approver = '박현수'
  cr.approvedAt = new Date().toISOString().slice(0, 10)
  // 실제 작업 데이터에 반영
  const t = aiTasks.value.find(x => x.id === cr.taskId)
  if (t) {
    t.start = cr.newStart; t.end = cr.newEnd
    t.isCritical = cr.newCp; t.weight = cr.newWeight; t.prev = cr.newPrev
    t.durDays = rangeDays(cr.newStart, cr.newEnd)
  }
  cr.status = '반영 완료'
  projectInfo.value.status = '변경 승인 완료'
  changeLog.value.unshift({
    id: Date.now(), at: new Date().toLocaleString('ko-KR'),
    who: '박현수', action: '승인',
    target: cr.taskName, detail: `${cr.changeType}: ${cr.oldStart}~${cr.oldEnd} → ${cr.newStart}~${cr.newEnd}`,
  })
}
function rejectChange(cr) {
  if (!canConfirm.value) { alert('변경 반려 권한이 없습니다.'); return }
  cr.status = '반려'
  cr.approver = '박현수'
  cr.approvedAt = new Date().toISOString().slice(0, 10)
  changeLog.value.unshift({
    id: Date.now(), at: new Date().toLocaleString('ko-KR'),
    who: '박현수', action: '반려',
    target: cr.taskName, detail: cr.reason,
  })
}
function reviewChange(cr) {
  cr.status = '검토 중'
}

// 줌
function zoomIn() { ganttZoom.value = Math.min(1.6, +(ganttZoom.value + 0.2).toFixed(1)) }
function zoomOut() { ganttZoom.value = Math.max(0.6, +(ganttZoom.value - 0.2).toFixed(1)) }
function scrollToToday() {
  const today = new Date().toISOString().slice(0, 10)
  if (today < projStart.value || today > projEnd.value) {
    alert('오늘 날짜가 공사 기간 밖입니다.')
    return
  }
  const el = document.getElementById('gantt-scroll')
  if (el) el.scrollLeft = Math.max(0, dayOffset(today) * cellW.value - 200)
}

onMounted(async () => {
  await nextTick()
  scrollToToday()
})
</script>

<style scoped>
.slide-detail-enter-active,
.slide-detail-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-detail-enter-from,
.slide-detail-leave-to {
  opacity: 0;
  width: 0;
  min-width: 0;
}
.slide-detail-enter-to,
.slide-detail-leave-from {
  opacity: 1;
  width: 320px;
}
</style>

<template>
  <div class="flex flex-col gap-5 pb-8">
    <!-- ============================================================ -->
    <!-- 1. 상단: 페이지 제목 + 현장 요약 + 주요 액션                       -->
    <!-- ============================================================ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">전체 공정표</h1>
        <p class="mt-1 text-xs text-forena-500">
          {{ projectInfo.projectName }} &nbsp | &nbsp {{ projectInfo.startDate }} ~ {{ projectInfo.endDate }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- 권한 데모 셀렉터 -->
        <div class="flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-2.5 py-1.5">
          <Users class="h-3.5 w-3.5 text-forena-400" />
          <select v-model="currentRole" class="bg-transparent text-xs font-bold text-forena-700 outline-none">
            <option v-for="r in ROLES" :key="r">{{ r }}</option>
          </select>
        </div>

        <button class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50"
                @click="$el?.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })">
          <Upload class="h-3.5 w-3.5 text-forena-400" /> 공정표 업로드
        </button>

        <button :disabled="aiAnalyzing"
                class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100 disabled:opacity-60"
                @click="runAiAnalysis">
          <BrainCircuit class="h-3.5 w-3.5 text-flare-600" />
          {{ aiAnalyzing ? 'AI 분석 중…' : 'AI 분석 실행' }}
        </button>

        <button v-if="!isConfirmed" :disabled="!canConfirm"
                class="inline-flex items-center gap-1.5 rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900 disabled:opacity-50"
                @click="openConfirm">
          <ShieldCheck class="h-3.5 w-3.5" /> 기준 공정표 확정
        </button>

        <button v-else
                class="inline-flex items-center gap-1.5 rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900"
                @click="openChangeManagement">
          <GitBranch class="h-3.5 w-3.5" /> 변경 요청 관리
          <span v-if="validationCounts.pendingChanges"
                class="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] tabular-nums">{{ validationCounts.pendingChanges }}</span>
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2. 검증 경고                                                  -->
    <!-- ============================================================ -->
    <!-- <div v-if="validation.length"
         class="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-card">
      <div class="flex items-center gap-2 mb-2">
        <AlertTriangle class="h-4 w-4 text-amber-600" />
        <h2 class="text-sm font-bold text-amber-800">공정표 검증 경고 ({{ validation.length }}건)</h2>
      </div>
      <ul class="grid gap-1.5" :class="gridClass">
        <li v-for="(v, i) in validation" :key="i"
            class="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs"
            :class="v.level === 'error' ? 'text-rose-700 ring-1 ring-rose-200'
                : v.level === 'warn' ? 'text-amber-800 ring-1 ring-amber-200'
                : 'text-sky-700 ring-1 ring-sky-200'">
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                :class="v.level === 'error' ? 'bg-rose-500' : v.level === 'warn' ? 'bg-amber-500' : 'bg-sky-500'"></span>
          {{ v.msg }}
        </li>
      </ul>
    </div>
    -->

    <!-- ============================================================ -->
    <!-- 3. 요약 카드                                                  -->
    <!-- ============================================================ -->
    <div class="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
      <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-3 shadow-card">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">계획 공정률</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ projectInfo.plannedProgress }}%</p>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-forena-100">
          <div class="h-full rounded-full bg-forena-600" :style="{ width: projectInfo.plannedProgress + '%' }" />
        </div>
      </div>
      <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-3 shadow-card">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">실제 공정률</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-rose-600">{{ projectInfo.actualProgress }}%</p>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-forena-100">
          <div class="h-full rounded-full bg-rose-500" :style="{ width: projectInfo.actualProgress + '%' }" />
        </div>
      </div>
      <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-3 shadow-card">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">전체 공정 수</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ aiTasks.length }}<span class="text-sm font-normal text-slate-400 ml-1">건</span></p>
      </div>
      <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-3 shadow-card">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">CP 공정 수</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-rose-700">{{ aiTasks.filter(t=>t.isCritical).length }}<span class="text-sm font-normal text-slate-400 ml-1">건</span></p>
      </div>
      <div class="rounded-2xl border p-3 shadow-card"
           :class="validationCounts.weightSum === 100 ? 'border-forena-100/90 bg-white/95' : 'border-amber-200 bg-amber-50/40'">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">보할 합계</p>
        <p class="mt-1 text-2xl font-bold tabular-nums" :class="validationCounts.weightSum === 100 ? 'text-emerald-600' : 'text-amber-700'">{{ validationCounts.weightSum }}%</p>
      </div>
      <div class="rounded-2xl border p-3 shadow-card"
           :class="validationCounts.unreviewed ? 'border-amber-200 bg-amber-50/40' : 'border-forena-100/90 bg-white/95'">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">미검토</p>
        <p class="mt-1 text-2xl font-bold tabular-nums" :class="validationCounts.unreviewed ? 'text-amber-700' : 'text-forena-900'">{{ validationCounts.unreviewed }}<span class="text-sm font-normal text-slate-400 ml-1">건</span></p>
      </div>
      <div class="rounded-2xl border p-3 shadow-card"
           :class="validationCounts.pendingChanges ? 'border-flare-200 bg-flare-50/40' : 'border-forena-100/90 bg-white/95'">
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">변경 요청 대기</p>
        <p class="mt-1 text-2xl font-bold tabular-nums" :class="validationCounts.pendingChanges ? 'text-flare-700' : 'text-forena-900'">{{ validationCounts.pendingChanges }}<span class="text-sm font-normal text-slate-400 ml-1">건</span></p>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 7. 간트차트 + 작업 상세 패널 (좌/우)                            -->
    <!-- ============================================================ -->
    <div class="flex gap-4 transition-all duration-300">
      <!-- 간트차트 -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card transition-all duration-300"
           :class="selectedTask ? 'flex-1 min-w-0' : 'w-full'">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <CalendarRange class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">전체 간트차트</h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- 보기 전환 -->
            <div class="flex overflow-hidden rounded-lg border border-forena-200">
              <button v-for="m in [['year','연간'],['month','월간'],['week','주간']]" :key="m[0]"
                      class="px-2.5 py-1 text-[11px] font-bold transition"
                      :class="ganttScale === m[0] ? 'bg-forena-800 text-white' : 'bg-white text-forena-600 hover:bg-forena-50'"
                      @click="ganttScale = m[0]; scrollToToday()">{{ m[1] }}</button>
            </div>
            <!-- 토글 -->
            <button @click="onlyCp = !onlyCp"
                    class="rounded-lg border px-2 py-1 text-[10px] font-bold"
                    :class="onlyCp ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
              CP만
            </button>
            <button @click="onlyMilestone = !onlyMilestone"
                    class="rounded-lg border px-2 py-1 text-[10px] font-bold"
                    :class="onlyMilestone ? 'border-flare-300 bg-flare-50 text-flare-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
              마일스톤
            </button>
            <button @click="highlightDelayed = !highlightDelayed"
                    class="rounded-lg border px-2 py-1 text-[10px] font-bold"
                    :class="highlightDelayed ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
              지연 강조
            </button>
            <!-- 줌/이동 -->
            <button @click="zoomOut" class="rounded-lg border border-forena-200 bg-white p-1.5 hover:bg-forena-50"><ZoomOut class="h-3.5 w-3.5 text-forena-600" /></button>
            <button @click="zoomIn"  class="rounded-lg border border-forena-200 bg-white p-1.5 hover:bg-forena-50"><ZoomIn class="h-3.5 w-3.5 text-forena-600" /></button>
            <button @click="scrollToToday"
                    class="inline-flex items-center gap-1 rounded-lg border border-forena-200 bg-white px-2 py-1 text-[10px] font-bold text-forena-600 hover:bg-forena-50">
              <Locate class="h-3 w-3" /> 오늘
            </button>
          </div>
        </div>

        <!-- 마일스톤 요약 -->
        <div class="border-b border-forena-100 bg-forena-50/30 px-5 py-3">
          <div class="flex items-center gap-2">
            <Flag class="h-3.5 w-3.5 text-flare-600" />
            <span class="text-[11px] font-bold text-forena-700 pr-2">마일스톤</span>
            <div v-for="m in milestones" :key="m.id"
                 class="flex items-center gap-1.5 rounded-md border border-forena-100 bg-white px-2 py-1 text-[10px]">
              <span class="font-bold text-forena-700">{{ m.name }}</span>
              <span class="tabular-nums text-slate-400">{{ m.date }}</span>
              <span class="rounded px-1 py-0.5 text-[9px] font-bold" :class="milestoneStatusClass(m.status)">{{ m.status }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">

          </div>
        </div>

        <div id="gantt-scroll" class="overflow-x-auto">
          <div class="flex">
            <!-- 좌측: 작업명 sticky -->
            <div class="sticky left-0 z-10 w-40 shrink-0 bg-white border-r border-forena-200">
              <div class="flex h-7 items-center border-b border-forena-200 bg-forena-50/60 px-4 text-[10px] font-bold text-forena-500">공정명 / 공종</div>
              <template v-for="(grp, gi) in groupedTasks" :key="grp.group">
                <!-- 공종 그룹 헤더 -->
                <div class="flex h-7 cursor-pointer items-center justify-between border-b border-forena-100 bg-forena-100 px-3 text-[11px] font-bold text-forena-700"
                     @click="groupOpen[grp.group] = !groupOpen[grp.group]">
                  <div class="flex items-center gap-1">
                    <ChevronDown v-if="groupOpen[grp.group]" class="h-3.5 w-3.5" />
                    <ChevronRight v-else class="h-3.5 w-3.5" />
                    <Layers class="h-3 w-3 text-forena-500" />
                    {{ grp.group }}
                  </div>
                  <span class="text-[10px] text-forena-400">{{ grp.items.length }}</span>
                </div>
                <template v-if="groupOpen[grp.group]">
                  <div v-for="t in grp.items" :key="t.id"
                       class="flex h-11 cursor-pointer flex-col justify-center border-b border-forena-50 px-4 transition hover:bg-forena-50/60"
                       :class="selectedTaskId === t.id ? 'bg-flare-50/60' : ''"
                       @click="selectedTaskId = t.id">
                    <div class="flex items-center gap-1">
                      <span v-if="t.isCritical" class="rounded bg-rose-100 px-1 py-0.5 text-[8px] font-bold text-rose-700">CP</span>
                      <p class="truncate text-xs font-semibold text-forena-800">{{ t.name }}</p>
                    </div>
                    <p class="truncate text-[10px] text-slate-400">{{ t.sub }} · 보할 {{ t.weight }}%</p>
                  </div>
                </template>
              </template>
            </div>

            <!-- 우측: 차트 -->
            <div class="relative" :style="{ width: ganttPxWidth + 'px' }">
              <!-- 헤더 -->
              <div class="sticky top-0 z-[5] flex h-7 border-b border-forena-200 bg-forena-50/30">
                <div v-for="(h, i) in ganttHeader" :key="i"
                     class="flex items-center justify-center border-r border-forena-100 text-[10px] font-bold text-forena-500"
                     :style="{ width: h.days * cellW + 'px' }">{{ h.label }}</div>
              </div>

              <!-- 본문 -->
              <div class="relative">
                <!-- 오늘 라인 -->
                <div v-if="todayLineStyle" class="pointer-events-none absolute top-0 z-[3] h-full w-px bg-flare-500/70" :style="todayLineStyle">
                  <div class="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-flare-500 px-1 text-[8px] font-bold text-white">오늘</div>
                </div>

                <!-- 마일스톤 마커 -->
                <template v-for="m in milestones" :key="`ms-${m.id}`">
                  <div class="pointer-events-none absolute z-[2] flex flex-col items-center"
                       :style="{ left: milestoneStyle(m.date).left, top: '0px' }">
                    <Flag class="h-3 w-3"
                          :class="m.status === '완료' ? 'text-emerald-500'
                            : m.status === '지연 위험' ? 'text-rose-500'
                            : 'text-flare-500'" />
                  </div>
                </template>

                <!-- 행 -->
                <template v-for="(grp, gi) in groupedTasks" :key="`grow-${grp.group}`">
                  <!-- 그룹 헤더 라인 (왼쪽 헤더 높이와 맞춤) -->
                  <div class="h-7 border-b border-forena-100 bg-forena-100"></div>
                  <template v-if="groupOpen[grp.group]">
                    <div v-for="t in grp.items" :key="`row-${t.id}`"
                         class="relative flex h-11 border-b border-forena-50"
                         :class="selectedTaskId === t.id ? 'bg-flare-50/40' : ''"
                         @click="selectedTaskId = t.id">
                      <!-- 라인: 계획 (파란) -->
                      <div v-if="barStyle(t.start, t.end) && (!onlyMilestone)"
                           class="absolute z-[2] flex items-center"
                           :style="{ ...barStyle(t.start, t.end), top: '14px', height: '4px' }"
                           :title="`계획: ${t.start} ~ ${t.end}`">
                        <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                              :class="t.isCritical ? 'h-3 w-3' : ''"></span>
                        <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                              :class="t.isCritical ? 'h-3 w-3' : ''"></span>
                        <span class="h-1 w-full rounded-full"
                              :class="t.isCritical ? 'bg-blue-700 h-1.5' : 'bg-blue-600'"></span>
                      </div>
                      <!-- 라인: 실제/지연 (빨간) - 데모용으로 기간 90% 표시 -->
                      <div v-if="barStyle(t.start, t.end) && (!onlyMilestone) && highlightDelayed && isDelayed(t)"
                           class="absolute z-[2] flex items-center"
                           :style="{ ...barStyle(t.start, t.end), top: '26px', height: '4px' }"
                           :title="`지연 의심: ${t.name}`">
                        <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                        <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                        <span class="h-1 w-full rounded-full bg-rose-500"></span>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>




        <!-- 범례 -->
        <div class="flex flex-wrap items-center gap-3 border-t border-forena-100  bg-forena-50/40 px-5 py-2 text-[10px] text-slate-600">
          <span class="inline-flex items-center gap-1.5"><span class="h-1 w-5 rounded-full bg-blue-600" />계획</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-1 w-5 rounded-full bg-rose-500" />실제/지연</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-1 w-5 rounded-full bg-emerald-500" />완료</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-1 w-5 rounded-full bg-amber-400" />검토 필요</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-1 w-5 rounded-full bg-slate-300" />시작 전</span>
          <span class="inline-flex items-center gap-1.5"><Flag class="h-3 w-3 text-flare-600" /> 마일스톤</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-px bg-flare-500" /> 오늘</span>
          <span class="ml-auto text-forena-400">줌 {{ ganttZoom }}x</span>
        </div>
      </div>

      <!-- 작업 상세 패널 -->
      <transition name="slide-detail">
        <div v-if="selectedTask"
             class="w-80 shrink-0 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
          <div class="flex items-center justify-between border-b border-forena-100 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">작업 상세</h2>
            <button @click="selectedTaskId = null" class="rounded-lg p-1 hover:bg-forena-50">
              <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
            </button>
          </div>
          <div class="overflow-y-auto" style="max-height: calc(100vh - 200px)">
            <div class="space-y-4 p-4">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <p class="text-base font-bold text-forena-900">{{ selectedTask.name }}</p>
                  <span v-if="selectedTask.isCritical" class="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">CP</span>
                </div>
                <p class="mt-0.5 text-xs text-slate-500">{{ selectedTask.group }} · {{ selectedTask.sub }}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">시작일</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.start }}</p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">종료일</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.end }}</p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">기간</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.durDays }}일</p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">보할</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.weight }}%</p>
                </div>
              </div>

              <!-- 선행/후속 -->
              <div>
                <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">선행 / 후속</p>
                <div class="flex items-center gap-2 text-xs">
                  <span class="flex-1 truncate rounded bg-slate-50 px-2 py-1.5 text-slate-700">{{ selectedTask.prev || '없음' }}</span>
                  <ArrowRight class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <span class="flex-1 truncate rounded bg-flare-50/60 px-2 py-1.5 text-flare-700">{{ selectedTask.next || '없음' }}</span>
                </div>
              </div>

              <!-- 인원/장비 -->
              <div class="rounded-lg border border-forena-100 p-3 text-xs">
                <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">담당 / 인원 / 장비</p>
                <div class="flex items-center gap-1.5 mb-1"><Users class="h-3 w-3 text-forena-500" />{{ selectedTask.responsible }} · {{ selectedTask.requiredCount }}명</div>
                <div class="flex items-center gap-1.5 mb-1"><MapPin class="h-3 w-3 text-forena-500" />{{ selectedTask.location }}</div>
                <div v-if="selectedTask.equipment.length" class="flex items-center gap-1.5"><Wrench class="h-3 w-3 text-forena-500" />{{ selectedTask.equipment.join(', ') }}</div>
              </div>

              <!-- AI 신뢰도 / 검토 -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg border border-forena-100 p-2.5">
                  <p class="text-[10px] font-bold text-forena-400 mb-1">AI 신뢰도</p>
                  <p class="text-lg font-bold tabular-nums" :class="confidenceClass(selectedTask.confidence)">{{ selectedTask.confidence }}%</p>
                </div>
                <div class="rounded-lg border border-forena-100 p-2.5">
                  <p class="text-[10px] font-bold text-forena-400 mb-1">검토 상태</p>
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="reviewStatusClass(selectedTask.reviewStatus)">{{ selectedTask.reviewStatus }}</span>
                </div>
              </div>

              <!-- 출처 문서 -->
              <div v-if="selectedTask.sourceDocId" class="rounded-lg border border-flare-100 bg-flare-50/30 p-3">
                <p class="text-[10px] font-bold uppercase text-flare-700 mb-1.5">출처 문서</p>
                <p class="text-xs font-semibold text-forena-800">
                  {{ uploadedDocs.find(d => d.id === selectedTask.sourceDocId)?.name || '연결된 문서 없음' }}
                </p>
                <div class="mt-2 flex gap-1.5">
                  <button class="rounded border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-600 hover:bg-forena-50">
                    <Eye class="inline h-2.5 w-2.5 mr-0.5" />보기
                  </button>
                  <button class="rounded border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-600 hover:bg-forena-50">
                    <Download class="inline h-2.5 w-2.5 mr-0.5" />다운로드
                  </button>
                  <button class="rounded border border-flare-200 bg-flare-50 px-2 py-0.5 text-[10px] font-bold text-flare-700 hover:bg-flare-100">
                    <RefreshCw class="inline h-2.5 w-2.5 mr-0.5" />재분석
                  </button>
                </div>
              </div>

              <!-- 메모 -->
              <div v-if="selectedTask.memo" class="rounded-lg bg-amber-50/40 p-2.5 text-[11px] text-amber-800 ring-1 ring-amber-100">
                <strong class="block text-[10px] uppercase">메모</strong>
                {{ selectedTask.memo }}
              </div>

              <!-- 액션 -->
              <div v-if="canEdit" class="flex gap-2">
                <button v-if="!isConfirmed" @click="openEdit(selectedTask)"
                        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-forena-800 py-2 text-xs font-bold text-white hover:bg-forena-900">
                  <Pencil class="h-3.5 w-3.5" /> 수정
                </button>
                <button v-else @click="openChangeRequestForm(selectedTask)"
                        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-flare-600 py-2 text-xs font-bold text-white hover:bg-flare-700">
                  <GitBranch class="h-3.5 w-3.5" /> 변경 요청
                </button>
              </div>
            </div><!-- /space-y-4 p-4 -->
          </div><!-- /overflow-y-auto -->
        </div><!-- /w-80 shrink-0 -->
      </transition>
    </div><!-- /flex gap-4 -->

    <!-- ============================================================ -->
    <!-- 4. 문서 등록 영역                                              -->
    <!-- ============================================================ -->
    <div id="upload-section"
         class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
        <FileText class="h-4 w-4 text-flare-600" />
        <h2 class="text-sm font-bold text-forena-900">문서 등록</h2>
        <span class="ml-1 text-[11px] text-forena-400">기준 공정표를 만들 원본 문서를 업로드하고 AI 분석을 실행합니다.</span>
      </div>

      <div class="grid gap-4 p-5 lg:grid-cols-12">
        <!-- 업로드 폼 -->
        <div class="lg:col-span-5 space-y-3">
          <div class="rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/40 p-5 text-center">
            <Upload class="mx-auto h-8 w-8 text-forena-300" />
            <p class="mt-2 text-sm font-semibold text-forena-700">파일을 끌어 놓거나 클릭하여 업로드</p>
            <p class="mt-0.5 text-[10px] text-forena-400">Excel · PDF · Image · Word · HWP</p>
            <label class="mt-3 inline-block cursor-pointer rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900">
              파일 선택
              <input type="file" class="sr-only"
                     accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.doc,.docx,.hwp"
                     @change="onUploadFile" />
            </label>
            <p v-if="uploadForm.fileName" class="mt-2 text-xs font-bold text-flare-700">📎 {{ uploadForm.fileName }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-bold uppercase text-forena-400">문서 유형</label>
              <select v-model="uploadForm.docType"
                      class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400">
                <option>마스터 공정표</option>
                <option>마일스톤 공정표</option>
                <option>공종별 시공계획서</option>
                <option>기타 공정 자료</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase text-forena-400">문서 설명</label>
              <input v-model="uploadForm.desc" type="text" placeholder="간단 설명 (선택)"
                     class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button @click="runAiAnalysis" :disabled="aiAnalyzing"
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-flare-600 px-3 py-2 text-xs font-bold text-white hover:bg-flare-700 disabled:opacity-60">
              <BrainCircuit class="h-3.5 w-3.5" />
              {{ aiAnalyzing ? '분석 중…' : 'AI 분석 실행' }}
            </button>
            <button @click="loadExistingDoc"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
              기존 문서 불러오기
            </button>
            <button @click="manualInput"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
              직접 입력
            </button>
          </div>
        </div>

        <!-- 문서 이력 -->
        <div class="lg:col-span-7">
          <p class="mb-2 text-[11px] font-bold text-forena-500">업로드 문서 ({{ uploadedDocs.length }})</p>
          <div class="overflow-hidden rounded-xl border border-forena-100">
            <table class="w-full text-xs">
              <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
              <tr>
                <th class="px-3 py-2 text-left">문서명</th>
                <th class="px-3 py-2 text-left">유형</th>
                <th class="px-3 py-2 text-left">업로드</th>
                <th class="px-3 py-2 text-left">상태</th>
                <th class="px-3 py-2 text-right">액션</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-forena-50">
              <tr v-for="d in uploadedDocs" :key="d.id" class="hover:bg-forena-50/40">
                <td class="px-3 py-2 font-semibold text-forena-800">{{ d.name }}</td>
                <td class="px-3 py-2 text-forena-600">{{ d.type }}</td>
                <td class="px-3 py-2 tabular-nums text-slate-500">{{ d.uploadedAt }}</td>
                <td class="px-3 py-2">
                    <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                          :class="d.reflectStatus === '반영 완료' ? 'bg-emerald-50 text-emerald-700'
                            : d.reflectStatus === '검토 중' ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-500'">
                      {{ d.reflectStatus }}
                    </span>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button @click="viewDoc(d)" title="원본 보기"
                            class="rounded p-1 text-forena-500 hover:bg-forena-100"><Eye class="h-3.5 w-3.5" /></button>
                    <button @click="downloadDoc(d)" title="다운로드"
                            class="rounded p-1 text-forena-500 hover:bg-forena-100"><Download class="h-3.5 w-3.5" /></button>
                    <button @click="reanalyze(d.id)" title="재분석"
                            class="rounded p-1 text-flare-600 hover:bg-flare-50"><RefreshCw class="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 5. 필터 + AI 분석 결과 검토 테이블                              -->
    <!-- ============================================================ -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-3">
        <div class="flex items-center gap-2">
          <BrainCircuit class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">AI 분석 결과 — 검토 테이블</h2>
          <span class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600">{{ filteredTasks.length }}건</span>
          <span v-if="isConfirmed" class="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">확정 — 직접 수정 불가</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- 검색 -->
          <div class="relative">
            <Search class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-forena-400" />
            <input v-model="searchKey" type="text" placeholder="작업/공종 검색"
                   class="w-44 rounded-lg border border-forena-200 bg-white pl-7 pr-2 py-1.5 text-xs outline-none focus:border-flare-400" />
          </div>
          <select v-model="filterGroup" class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
            <option value="">전체 공종</option>
            <option v-for="g in [...new Set(aiTasks.map(t=>t.group))]" :key="g">{{ g }}</option>
          </select>
          <select v-model="filterReview" class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
            <option value="">전체 상태</option>
            <option>미검토</option><option>검토 중</option><option>승인</option><option>수정 요청</option><option>제외</option>
          </select>
          <select v-model="filterCp" class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
            <option value="">CP 전체</option>
            <option value="cp">CP만</option>
            <option value="noncp">CP 제외</option>
          </select>

          <div v-if="canEdit && !isConfirmed" class="flex gap-1">
            <button @click="bulkApprove"
                    class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
              일괄 승인
            </button>
            <button @click="bulkExclude"
                    class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100">
              일괄 제외
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1100px] text-xs">
          <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
          <tr>
            <th class="w-8 px-2 py-2"><input type="checkbox" disabled /></th>
            <th class="px-3 py-2 text-left">공종</th>
            <th class="px-3 py-2 text-left">작업명</th>
            <th class="px-3 py-2 text-left">시작일</th>
            <th class="px-3 py-2 text-left">종료일</th>
            <th class="px-3 py-2 text-right">기간</th>
            <th class="px-3 py-2 text-left">선행</th>
            <th class="px-3 py-2 text-left">후속</th>
            <th class="px-3 py-2 text-center">CP</th>
            <th class="px-3 py-2 text-right">보할</th>
            <th class="px-3 py-2 text-right">신뢰도</th>
            <th class="px-3 py-2 text-left">상태</th>
            <th class="px-3 py-2"></th>
          </tr>
          </thead>
          <tbody class="divide-y divide-forena-50">
          <tr v-for="t in filteredTasks" :key="t.id"
              class="cursor-pointer transition hover:bg-forena-50/40"
              :class="selectedTaskId === t.id ? 'bg-flare-50/50' : ''"
              @click="selectedTaskId = t.id">
            <td class="px-2 py-2" @click.stop>
              <input type="checkbox" v-model="t.checked" :disabled="isConfirmed" />
            </td>
            <td class="px-3 py-2">
              <p class="font-semibold text-forena-700">{{ t.group }}</p>
              <p class="text-[10px] text-slate-400">{{ t.sub }}</p>
            </td>
            <td class="px-3 py-2 font-semibold text-forena-900">{{ t.name }}</td>
            <td class="px-3 py-2 tabular-nums text-slate-600">{{ t.start }}</td>
            <td class="px-3 py-2 tabular-nums text-slate-600">{{ t.end }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-slate-500">{{ t.durDays }}일</td>
            <td class="px-3 py-2 text-[11px] text-slate-500">{{ t.prev || '-' }}</td>
            <td class="px-3 py-2 text-[11px] text-slate-500">{{ t.next || '-' }}</td>
            <td class="px-3 py-2 text-center">
              <span v-if="t.isCritical" class="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">CP</span>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-3 py-2 text-right tabular-nums font-bold text-forena-700">{{ t.weight }}%</td>
            <td class="px-3 py-2 text-right tabular-nums font-bold" :class="confidenceClass(t.confidence)">{{ t.confidence }}%</td>
            <td class="px-3 py-2">
              <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="reviewStatusClass(t.reviewStatus)">{{ t.reviewStatus }}</span>
            </td>
            <td class="px-3 py-2 text-right" @click.stop>
              <button v-if="canEdit" @click="openEdit(t)"
                      class="rounded p-1 text-forena-500 hover:bg-forena-100"
                      :title="isConfirmed ? '변경 요청' : '수정'">
                <Pencil class="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
          <tr v-if="!filteredTasks.length">
            <td colspan="13" class="px-3 py-12 text-center text-sm text-slate-400">
              조회된 작업이 없습니다.
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 6. 공종별 진척률                                              -->
    <!-- ============================================================ -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <div class="flex items-center gap-2 border-b border-forena-100 pb-3">
        <BarChart3 class="h-4 w-4 text-flare-600" />
        <h2 class="text-sm font-bold text-forena-900">공종별 진척률 (계획 vs 실제)</h2>
      </div>
      <div class="mt-4 space-y-3">
        <div v-for="g in groupProgress" :key="g.group">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-forena-800">{{ g.group }}</span>
            <span class="tabular-nums text-slate-500">
              계획 <strong class="text-forena-700">{{ g.plan }}%</strong> ·
              실제 <strong class="text-rose-600">{{ g.actual }}%</strong> ·
              차이 <strong :class="g.diff < 0 ? 'text-rose-600' : 'text-emerald-600'">{{ g.diff > 0 ? '+' : '' }}{{ g.diff }}%</strong>
            </span>
          </div>
          <div class="relative h-2.5 overflow-hidden rounded-full bg-forena-100">
            <div class="absolute inset-y-0 left-0 rounded-full bg-forena-400" :style="{ width: g.plan + '%' }" />
            <div class="absolute inset-y-0 left-0 rounded-full bg-rose-500/80" :style="{ width: g.actual + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 8. 마일스톤 테이블 + 변경 이력                                 -->
    <!-- ============================================================ -->
    <div class="grid gap-4 lg:grid-cols-12">
      <!-- 마일스톤 -->
      <div class="lg:col-span-7 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <Target class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">마일스톤 관리</h2>
        </div>
        <table class="w-full text-xs">
          <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
          <tr>
            <th class="px-3 py-2 text-left">마일스톤</th>
            <th class="px-3 py-2 text-left">기준일</th>
            <th class="px-3 py-2 text-left">관련 공정</th>
            <th class="px-3 py-2 text-center">상태</th>
            <th class="px-3 py-2 text-center">영향도</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-forena-50">
          <tr v-for="m in milestones" :key="m.id" class="hover:bg-forena-50/40">
            <td class="px-3 py-2 font-semibold text-forena-800">
              <div class="flex items-center gap-1.5">
                <Flag class="h-3 w-3"
                      :class="m.status === '완료' ? 'text-emerald-500' : m.status === '지연 위험' ? 'text-rose-500' : 'text-flare-500'" />
                {{ m.name }}
              </div>
            </td>
            <td class="px-3 py-2 tabular-nums text-slate-600">{{ m.date }}</td>
            <td class="px-3 py-2 text-slate-500">{{ m.relatedTask }}</td>
            <td class="px-3 py-2 text-center">
              <span class="rounded px-1.5 py-0.5 text-[10px] font-bold" :class="milestoneStatusClass(m.status)">{{ m.status }}</span>
            </td>
            <td class="px-3 py-2 text-center">
                <span class="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      :class="m.impact === '고' ? 'bg-rose-50 text-rose-700' : m.impact === '중' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'">
                  {{ m.impact }}
                </span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 변경 이력 -->
      <div class="lg:col-span-5 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <History class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">변경 이력</h2>
          <span class="ml-auto text-[10px] text-forena-400">최종 확정자: {{ projectInfo.finalApprover }}</span>
        </div>
        <ul class="divide-y divide-forena-50 max-h-72 overflow-y-auto">
          <li v-for="log in changeLog" :key="log.id" class="px-4 py-2.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    :class="log.action === '승인' || log.action === '기준 공정표 확정' ? 'bg-emerald-50 text-emerald-700'
                      : log.action === '반려' ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-500'">
                {{ log.action }}
              </span>
              <span class="min-w-0 flex-1 truncate font-semibold text-forena-800">{{ log.target }}</span>
              <span class="shrink-0 tabular-nums text-forena-400">{{ log.at }}</span>
            </div>
            <p class="mt-1 text-[11px] text-slate-500">{{ log.who }} · {{ log.detail }}</p>
          </li>
        </ul>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 작업 수정 (확정 전)                                     -->
    <!-- ============================================================ -->
    <div v-if="editModalOpen && editForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="editModalOpen = false">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <h3 class="text-sm font-bold text-forena-900">작업 수정 — {{ editForm._original.name }}</h3>
          <button @click="editModalOpen = false"><X class="h-4 w-4 text-slate-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 p-5 max-h-[70vh] overflow-y-auto">
          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">작업명</label>
            <input v-model="editForm.name" type="text"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
            <p v-if="editForm.name !== editForm._original.name" class="mt-0.5 text-[10px] text-amber-600">
              변경 전: <span class="line-through">{{ editForm._original.name }}</span>
            </p>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">공종</label>
            <input v-model="editForm.group" type="text" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">작업 위치</label>
            <input v-model="editForm.location" type="text" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">시작일</label>
            <input v-model="editForm.start" type="date" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
            <p v-if="editForm.start !== editForm._original.start" class="mt-0.5 text-[10px] text-amber-600">변경 전: {{ editForm._original.start }}</p>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">종료일</label>
            <input v-model="editForm.end" type="date" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
            <p v-if="editForm.end !== editForm._original.end" class="mt-0.5 text-[10px] text-amber-600">변경 전: {{ editForm._original.end }}</p>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">CP 여부</label>
            <select v-model="editForm.isCritical" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400">
              <option :value="true">CP</option>
              <option :value="false">비CP</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">보할 (%)</label>
            <input v-model.number="editForm.weight" type="number" min="0" max="100" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
            <p v-if="editForm.weight !== editForm._original.weight" class="mt-0.5 text-[10px] text-amber-600">변경 전: {{ editForm._original.weight }}%</p>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">선행 작업</label>
            <input v-model="editForm.prev" type="text" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">후속 작업</label>
            <input v-model="editForm.next" type="text" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">담당 책임자</label>
            <input v-model="editForm.responsible" type="text" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">필요 인원</label>
            <input v-model.number="editForm.requiredCount" type="number" min="0" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
          </div>
          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">메모</label>
            <textarea v-model="editForm.memo" rows="2" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-3">
          <button @click="editModalOpen = false" class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">취소</button>
          <button @click="saveEdit" class="rounded-lg bg-forena-800 px-4 py-2 text-xs font-bold text-white hover:bg-forena-900">저장</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 기준 공정표 확정 — 검증 미리보기                          -->
    <!-- ============================================================ -->
    <div v-if="confirmModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="confirmModalOpen = false">
      <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <ShieldCheck class="h-4 w-4 text-emerald-600" />
          <h3 class="text-sm font-bold text-forena-900">기준 공정표 확정</h3>
        </div>
        <div class="space-y-3 p-5">
          <p class="text-xs text-slate-600">기준 공정표를 확정하면 이후 수정은 변경 요청을 통해서만 가능합니다.</p>

          <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
            <p class="mb-2 text-[10px] font-bold uppercase text-forena-500">확정 전 검증</p>
            <ul class="space-y-1.5 text-xs">
              <li v-for="(v, i) in validation" :key="i" class="flex items-start gap-2">
                <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      :class="v.level === 'error' ? 'bg-rose-500' : v.level === 'warn' ? 'bg-amber-500' : 'bg-sky-500'"></span>
                <span :class="v.level === 'error' ? 'text-rose-700' : v.level === 'warn' ? 'text-amber-800' : 'text-sky-700'">{{ v.msg }}</span>
              </li>
              <li v-if="!validation.length" class="text-emerald-700"><CheckCircle2 class="inline h-3.5 w-3.5 mr-1" />검증 항목 모두 통과</li>
            </ul>
          </div>

          <div class="rounded-lg bg-amber-50/40 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-100">
            확정 후에는 본 페이지의 테이블/간트차트에서 직접 수정이 불가능하며, 변경 요청 절차를 따라야 합니다.
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-3">
          <button @click="confirmModalOpen = false" class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">취소</button>
          <button @click="confirmBaseline" class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <ShieldCheck class="inline h-3.5 w-3.5 mr-1" />확정
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 변경 요청 폼 (확정 후 작업 수정 시)                        -->
    <!-- ============================================================ -->
    <div v-if="changeRequestFormOpen && newChangeReq" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="changeRequestFormOpen = false">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <h3 class="text-sm font-bold text-forena-900">변경 요청 — {{ newChangeReq.taskName }}</h3>
          <button @click="changeRequestFormOpen = false"><X class="h-4 w-4 text-slate-400" /></button>
        </div>
        <div class="grid grid-cols-2 gap-3 p-5">
          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">변경 유형</label>
            <select v-model="newChangeReq.changeType" class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400">
              <option>시작일 변경</option><option>종료일 변경</option><option>기간 연장</option>
              <option>기간 단축</option><option>작업명 변경</option><option>CP 변경</option>
              <option>보할 변경</option><option>선행/후속 작업 변경</option>
            </select>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-3 rounded-xl bg-forena-50/40 p-3">
            <div class="col-span-2 text-[10px] font-bold uppercase text-forena-500">변경 전 → 변경 후</div>
            <div>
              <label class="text-[10px] text-forena-400">기존 시작일</label>
              <input :value="newChangeReq.oldStart" disabled class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500" />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 시작일</label>
              <input v-model="newChangeReq.newStart" type="date" class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">기존 종료일</label>
              <input :value="newChangeReq.oldEnd" disabled class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500" />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 종료일</label>
              <input v-model="newChangeReq.newEnd" type="date" class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">기존 보할</label>
              <input :value="newChangeReq.oldWeight + '%'" disabled class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500" />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 보할 (%)</label>
              <input v-model.number="newChangeReq.newWeight" type="number" class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs" />
            </div>
          </div>

          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">변경 사유 (필수)</label>
            <textarea v-model="newChangeReq.reason" rows="3" placeholder="현장 사유를 구체적으로 기재해 주세요"
                      class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-3">
          <button @click="changeRequestFormOpen = false" class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">취소</button>
          <button @click="submitChangeRequest" class="rounded-lg bg-flare-600 px-4 py-2 text-xs font-bold text-white hover:bg-flare-700">
            <GitBranch class="inline h-3.5 w-3.5 mr-1" />변경 요청 등록
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 변경 요청 관리 — 큰 패널                                  -->
    <!-- ============================================================ -->
    <div v-if="changeModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="changeModalOpen = false">
      <div class="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <GitBranch class="h-4 w-4 text-flare-600" />
            <h3 class="text-sm font-bold text-forena-900">변경 요청 관리</h3>
            <span class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600">{{ changeRequests.length }}건</span>
          </div>
          <button @click="changeModalOpen = false"><X class="h-4 w-4 text-slate-400" /></button>
        </div>

        <div class="flex min-h-0 flex-1">
          <!-- 좌: 요청 테이블 -->
          <div class="flex-1 overflow-auto border-r border-forena-100">
            <table class="w-full text-xs">
              <thead class="sticky top-0 z-10 bg-forena-50/95 text-[10px] font-bold uppercase text-forena-500 backdrop-blur">
              <tr>
                <th class="px-3 py-2 text-left">요청일</th>
                <th class="px-3 py-2 text-left">작업명</th>
                <th class="px-3 py-2 text-left">공종</th>
                <th class="px-3 py-2 text-left">변경 유형</th>
                <th class="px-3 py-2 text-left">기존 기간</th>
                <th class="px-3 py-2 text-left">변경 요청</th>
                <th class="px-3 py-2 text-left">요청자</th>
                <th class="px-3 py-2 text-center">상태</th>
                <th class="px-3 py-2 text-center">영향</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-forena-50">
              <tr v-for="cr in changeRequests" :key="cr.id"
                  class="cursor-pointer hover:bg-forena-50/40"
                  :class="selectedChangeId === cr.id ? 'bg-flare-50/40' : ''"
                  @click="selectedChangeId = cr.id">
                <td class="px-3 py-2 tabular-nums text-slate-500">{{ cr.requestedAt }}</td>
                <td class="px-3 py-2 font-semibold text-forena-800">{{ cr.taskName }}</td>
                <td class="px-3 py-2 text-slate-600">{{ cr.group }}</td>
                <td class="px-3 py-2 text-slate-600">{{ cr.changeType }}</td>
                <td class="px-3 py-2 tabular-nums text-[11px] text-slate-500">{{ cr.oldStart.slice(5) }}~{{ cr.oldEnd.slice(5) }}</td>
                <td class="px-3 py-2 tabular-nums text-[11px] text-flare-700">{{ cr.newStart.slice(5) }}~{{ cr.newEnd.slice(5) }}</td>
                <td class="px-3 py-2 text-slate-600">{{ cr.requester }}</td>
                <td class="px-3 py-2 text-center">
                  <span class="rounded px-1.5 py-0.5 text-[10px] font-bold" :class="crStatusClass(cr.status)">{{ cr.status }}</span>
                </td>
                <td class="px-3 py-2 text-center">
                  <span v-if="cr.cpImpact" class="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">CP</span>
                  <span v-else class="text-slate-300">—</span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- 우: 변경 요청 상세 -->
          <div class="flex w-[420px] shrink-0 flex-col bg-white">
            <div v-if="!selectedChange" class="flex h-full items-center justify-center text-sm text-slate-400">
              왼쪽 목록에서 변경 요청을 선택하세요
            </div>
            <div v-else class="flex min-h-0 flex-1 flex-col">
              <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
                <p class="text-sm font-bold text-forena-900">변경 요청 상세</p>
                <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="crStatusClass(selectedChange.status)">{{ selectedChange.status }}</span>
              </div>

              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <!-- 작업 기본 -->
                <div>
                  <p class="text-base font-bold text-forena-900">{{ selectedChange.taskName }}</p>
                  <p class="text-xs text-slate-500">{{ selectedChange.group }} · {{ selectedChange.changeType }}</p>
                </div>

                <!-- 변경 전/후 비교 -->
                <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
                  <p class="mb-2 text-[10px] font-bold uppercase text-forena-500">변경 전 → 변경 후</p>
                  <div class="space-y-2 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">시작일</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through">{{ selectedChange.oldStart }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newStart }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">종료일</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through">{{ selectedChange.oldEnd }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newEnd }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">CP 여부</span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-500">{{ selectedChange.oldCp ? 'CP' : '비CP' }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newCp ? 'CP' : '비CP' }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">보할</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through">{{ selectedChange.oldWeight }}%</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newWeight }}%</span>
                      </div>
                    </div>
                    <div class="flex items-start justify-between gap-2">
                      <span class="text-forena-500">선행 작업</span>
                      <div class="flex items-center gap-1.5 text-right">
                        <span class="text-slate-500 line-through">{{ selectedChange.oldPrev || '없음' }}</span>
                        <ArrowRight class="h-3 w-3 shrink-0 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newPrev || '없음' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 변경 사유 -->
                <div class="rounded-xl border border-forena-100 p-3">
                  <p class="mb-1 text-[10px] font-bold uppercase text-forena-500">변경 사유</p>
                  <p class="text-xs leading-relaxed text-forena-800">{{ selectedChange.reason }}</p>
                  <p class="mt-2 text-[10px] text-slate-400">{{ selectedChange.requester }} · {{ selectedChange.requestedAt }}</p>
                </div>

                <!-- AI 영향 분석 -->
                <div class="rounded-xl border border-flare-100 bg-flare-50/30 p-3">
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <BrainCircuit class="h-3.5 w-3.5 text-flare-600" />
                    <p class="text-[10px] font-bold uppercase text-flare-700">AI 영향 분석</p>
                  </div>
                  <p class="text-xs leading-relaxed text-forena-800">{{ selectedChange.aiSummary }}</p>
                </div>

                <!-- 영향도 -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-lg p-2.5"
                       :class="selectedChange.cpImpact ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-forena-50/40'">
                    <p class="text-[10px] font-bold text-forena-500 mb-1">CP 영향</p>
                    <p class="font-bold" :class="selectedChange.cpImpact ? 'text-rose-700' : 'text-slate-500'">{{ selectedChange.cpImpact ? '있음' : '없음' }}</p>
                  </div>
                  <div class="rounded-lg p-2.5"
                       :class="selectedChange.expectedDelayDays > 0 ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-forena-50/40'">
                    <p class="text-[10px] font-bold text-forena-500 mb-1">예상 지연</p>
                    <p class="font-bold tabular-nums" :class="selectedChange.expectedDelayDays > 0 ? 'text-amber-700' : 'text-emerald-600'">
                      {{ selectedChange.expectedDelayDays > 0 ? `+${selectedChange.expectedDelayDays}일` : '없음' }}
                    </p>
                  </div>
                </div>

                <!-- 후속 영향 -->
                <div v-if="selectedChange.affectedTasks?.length">
                  <p class="text-[10px] font-bold uppercase text-forena-500 mb-1.5">영향 받는 후속 공정</p>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="(t, i) in selectedChange.affectedTasks" :key="i"
                          class="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-100">{{ t }}</span>
                  </div>
                </div>

                <!-- 마일스톤 영향 -->
                <div class="text-xs">
                  <p class="text-[10px] font-bold uppercase text-forena-500 mb-1">마일스톤 영향</p>
                  <p class="text-forena-700">{{ selectedChange.milestoneImpact }}</p>
                </div>

                <!-- 승인자 정보 -->
                <div v-if="selectedChange.approver" class="rounded-lg bg-emerald-50/40 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-emerald-100">
                  처리자: <strong>{{ selectedChange.approver }}</strong> · {{ selectedChange.approvedAt }}
                </div>
              </div>

              <!-- 액션 -->
              <div class="border-t border-forena-100 p-3">
                <div v-if="['요청됨','검토 중'].includes(selectedChange.status)" class="grid grid-cols-3 gap-2">
                  <button @click="reviewChange(selectedChange)"
                          class="flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
                    <MessagesSquare class="h-3.5 w-3.5" />검토
                  </button>
                  <button @click="approveChange(selectedChange)" :disabled="!canConfirm"
                          class="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <ThumbsUp class="h-3.5 w-3.5" />승인
                  </button>
                  <button @click="rejectChange(selectedChange)" :disabled="!canConfirm"
                          class="flex items-center justify-center gap-1 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                    <ThumbsDown class="h-3.5 w-3.5" />반려
                  </button>
                </div>
                <div v-else class="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                  처리 완료 — {{ selectedChange.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>