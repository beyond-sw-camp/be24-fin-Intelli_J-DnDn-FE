<script setup>
import { computed, ref, watch } from 'vue'
import {
  CalendarRange,
  LayoutDashboard,
  Upload,
  FileText,
  Plus,
  BarChart3,
  MapPin,
} from 'lucide-vue-next'

const T = {
  kicker: '일정',
  title: '작업 계획',
  desc: '공종별 작업 계획서를 업로드하면 문서에서 일정을 추출하여 공종별 작업 계획 일정을 확인합니다. TXT·CSV는 날짜 파싱을 지원하며, 그 외 파일은 데모용 샘플 기간을 생성합니다.',
  tradeReports: '공종별 보고서',
  uploadCta: '보고서 업로드',
  uploadHint: 'PDF, Office, CSV, TXT',
  addTradeSection: '공종(공사) 추가',
  newTradePh: '새 공종 명을 입력하세요',
  extractedLabel: '추출된 작업 일정',
  noExtract:
    '아직 업로드된 보고서가 없습니다.',
  weekNoBars:
    '선택한 주차에 표시할 일정이 없습니다.',
  monthPick: '기준 월',
  sourceDoc: '출처 문서',
  demoNote:
    '이미지·PDF 등은 서버 OCR 없이 날짜를 읽지 못하므로, 파일명 기반 샘플 계획이 생성됩니다.',
  sectionSchedule: '공종별 작업 계획 일정',
  tabMonth: '월간',
  tabWeek: '주간',
  weekOfMonth: '주차',
  legendPlan: '계획',
  legendActual: '실적',
  colTask: '공정명',
  colType: '공종',
  countUnit: '건',
  secProgress: '공정 진행 상황',
  progressViz: '공종별 진행률',
  progressVizSub: '통합 작업 계획 기준 공정별 진행 지표를 요약합니다.',
  overall: '전체 공사 진행률',
}

const planViewYear = ref(2025)
const planViewMonth = ref(10)

const DEMO_Y = 2025
const DEMO_M = 10

let tradeIdSeq = 1
function nextTradeId() {
  return `trade-${Date.now().toString(36)}-${tradeIdSeq++}`
}

const defaultTrades = [
  { id: 'steel', label: '건축 / 철근' },
  { id: 'pile', label: '파일 공사' },
  { id: 'earth', label: '토목 공사' },
  { id: 'tunnel', label: '톰링 / 가오사' },
  { id: 'elec', label: '전기 공사' },
]

const categoryChips = ['전체', '골조', '내장', '설비']
const activeCategoryChip = ref('전체')
const tradeChipMap = ref({
  steel: '골조',
  pile: '골조',
  earth: '내장',
  tunnel: '내장',
  elec: '설비',
})

const overallProgress = ref(62)
const progressByCategory = ref([
  { name: '골조', pct: 74 },
  { name: '기초', pct: 68 },
  { name: '전기', pct: 52 },
  { name: '마감', pct: 41 },
])

/** @param {string} task @param {number} d0 @param {number} d1 @param {[number, number] | null} actual */
function demoSeg(task, d0, d1, actual = null) {
  const o = {
    task,
    plan: { y: DEMO_Y, m: DEMO_M, d0, d1 },
    actual: null,
  }
  if (actual) {
    o.actual = { y: DEMO_Y, m: DEMO_M, d0: actual[0], d1: actual[1] }
  }
  return o
}

const exampleUploadsByTrade = {
  steel: [
    {
      fileName: '샘플_철근_승라브_3F.pdf',
      segments: [demoSeg('본동 3축 슬라브 철근 박・고정', 3, 12, [4, 13])],
    },
  ],
  pile: [
    {
      fileName: '샘플_A2단지_파일계획.xlsx',
      segments: [demoSeg('A-2 구간 파일 거제', 6, 15, [7, 15])],
    },
  ],
  earth: [
    {
      fileName: '샘플_구간_깨다_토추.pdf',
      segments: [
        demoSeg('뺄엔 구간 깨다 및 사몰', 1, 9, [2, 10]),
        demoSeg('지해 방수 공', 8, 17, [9, 16]),
      ],
    },
  ],
  tunnel: [
    {
      fileName: '샘플_EV_PIT_톤링.pdf',
      segments: [
        demoSeg('Joint Pipe EV PIT', 10, 22, [11, 23]),
        demoSeg('톤넛 내 배관 시공', 18, 28, [19, 27]),
      ],
    },
  ],
  elec: [
    {
      fileName: '샘플_전기_라이저_설선.csv',
      segments: [demoSeg('전기 라이저 베이스 및 동선', 12, 24, [13, 24])],
    },
  ],
}

const tradeSites = ref([...defaultTrades])
const newTradeName = ref('')

const tradeUploads = ref(
  Object.fromEntries(
    defaultTrades.map((t) => [
      t.id,
      structuredClone(exampleUploadsByTrade[t.id] ?? []),
    ]),
  ),
)

/** @type {Record<string, HTMLInputElement | undefined>} */
const tradeFileInputs = {}

function setTradeFileInput(tradeId, el) {
  if (el) tradeFileInputs[tradeId] = /** @type {HTMLInputElement} */ (el)
  else delete tradeFileInputs[tradeId]
}

function openTradeFilePicker(tradeId) {
  tradeFileInputs[tradeId]?.click()
}

function addTradeSection() {
  const name = newTradeName.value.trim()
  if (!name) return
  const id = nextTradeId()
  tradeSites.value = [...tradeSites.value, { id, label: name }]
  tradeUploads.value = { ...tradeUploads.value, [id]: [] }
  tradeChipMap.value = {
    ...tradeChipMap.value,
    [id]: activeCategoryChip.value === '전체' ? '골조' : activeCategoryChip.value,
  }
  newTradeName.value = ''
}

const scheduleTab = ref('month')
const planWeekIndex = ref(0)

watch([planViewYear, planViewMonth], () => {
  planWeekIndex.value = 0
})

function weekChunksOfMonth(y, m) {
  const last = new Date(y, m, 0).getDate()
  const chunks = []
  for (let start = 1; start <= last; start += 7) {
    const end = Math.min(start + 6, last)
    chunks.push({
      start,
      end,
      label: `${start}~${end}일`,
    })
  }
  return chunks
}

const monthWeekChunks = computed(() =>
  weekChunksOfMonth(planViewYear.value, planViewMonth.value),
)

watch(monthWeekChunks, (chunks) => {
  if (planWeekIndex.value >= chunks.length) planWeekIndex.value = Math.max(0, chunks.length - 1)
})

const ganttTimeline = computed(() => {
  const y = planViewYear.value
  const mo = planViewMonth.value
  const last = new Date(y, mo, 0).getDate()
  if (scheduleTab.value === 'month') {
    return {
      mode: 'month',
      count: last,
      labels: Array.from({ length: last }, (_, i) => String(i + 1)),
      y,
      m: mo,
      chunkStart: 1,
      chunkEnd: last,
      chunkLabel: '',
    }
  }
  const chunks = weekChunksOfMonth(y, mo)
  const idx = Math.min(planWeekIndex.value, Math.max(0, chunks.length - 1))
  const ch = chunks[idx] ?? { start: 1, end: last, label: '' }
  const span = ch.end - ch.start + 1
  return {
    mode: 'week',
    count: span,
    labels: Array.from({ length: span }, (_, i) => String(ch.start + i)),
    y,
    m: mo,
    chunkStart: ch.start,
    chunkEnd: ch.end,
    chunkLabel: ch.label,
  }
})

const DATE_RE = /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/g

function parseDatesFromText(text) {
  const dates = []
  let m
  const re = new RegExp(DATE_RE.source, 'g')
  while ((m = re.exec(text)) !== null) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) dates.push({ y, m: mo, d })
  }
  dates.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.m !== b.m ? a.m - b.m : a.d - b.d))
  return dates
}

function firstLineTask(text, fallback) {
  const line = text.split(/\r?\n/).find((l) => l.trim().length > 0)
  if (!line) return fallback
  const cleaned = line.replace(DATE_RE, '').replace(/[,;]/g, ' ').trim()
  return cleaned.slice(0, 80) || fallback
}

function parseFilenameRange(name) {
  const re = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})/g
  const found = []
  let m
  while ((m = re.exec(name)) !== null) {
    found.push({
      y: Number(m[1]),
      m: Number(m[2]),
      d: Number(m[3]),
    })
  }
  if (found.length >= 2) {
    const a = found[0]
    const b = found[found.length - 1]
    return { a, b }
  }
  return null
}

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function mockSegmentFromFile(fileName, tradeLabel) {
  const y = planViewYear.value
  const m = planViewMonth.value
  const lastDay = new Date(y, m, 0).getDate()
  const fnRange = parseFilenameRange(fileName)
  if (fnRange) {
    const d0 = fnRange.a.m === m && fnRange.a.y === y ? fnRange.a.d : Math.min(fnRange.a.d, lastDay)
    const d1 = fnRange.b.m === m && fnRange.b.y === y ? fnRange.b.d : Math.min(fnRange.b.d, lastDay)
    if (fnRange.a.y !== y || fnRange.a.m !== m) {
      const span = Math.min(10, lastDay - 2)
      const start = 2 + (hashStr(fileName) % Math.max(1, lastDay - span - 2))
      return {
        task: fileName.replace(/\.[^.]+$/, ''),
        plan: { y, m, d0: start, d1: Math.min(lastDay, start + span) },
        actual: null,
      }
    }
    return {
      task: fileName.replace(/\.[^.]+$/, ''),
      plan: {
        y,
        m,
        d0: Math.max(1, Math.min(d0, lastDay)),
        d1: Math.max(1, Math.min(d1, lastDay)),
      },
      actual:
        d1 > d0 ? { y, m, d0: Math.min(lastDay, d0 + 1), d1: Math.min(lastDay, d1 + 1) } : null,
    }
  }
  const h = hashStr(fileName)
  const len = 4 + (h % 8)
  const start = 1 + (h % Math.max(1, lastDay - len))
  const d0 = start
  const d1 = Math.min(lastDay, start + len - 1)
  const ad0 = Math.min(lastDay, d0 + (h % 2))
  const ad1 = Math.min(lastDay, d1 + (h % 3))
  return {
    task: `${tradeLabel} 계획 (${fileName.replace(/\.[^.]+$/, '')})`,
    plan: { y, m, d0, d1 },
    actual: ad1 >= ad0 ? { y, m, d0: ad0, d1: ad1 } : null,
  }
}

function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = lines[0].split(/[,;\t]/).map((c) => c.trim())
  const idx = (nameVariants) => {
    const lower = header.map((h) => h.toLowerCase())
    for (const v of nameVariants) {
      const i = lower.indexOf(v.toLowerCase())
      if (i >= 0) return i
    }
    return -1
  }
  const iTask = idx(['공정', '공종', 'task', '항목', '작업'])
  const iPs = idx(['계획시작', 'plan_start', 'start', '시작'])
  const iPe = idx(['계획종료', 'plan_end', 'end', '종료'])
  const iAs = idx(['실적시작', 'actual_start'])
  const iAe = idx(['실적종료', 'actual_end'])
  const out = []
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(/[,;\t]/).map((c) => c.trim())
    const task = (iTask >= 0 ? cols[iTask] : null) || cols[0] || `행 ${r}`
    const parseCell = (ci) => {
      if (ci < 0 || !cols[ci]) return null
      const mm = cols[ci].match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
      if (!mm) return null
      return { y: Number(mm[1]), m: Number(mm[2]), d: Number(mm[3]) }
    }
    const ps = parseCell(iPs >= 0 ? iPs : 1)
    const pe = parseCell(iPe >= 0 ? iPe : 2)
    if (!ps || !pe) continue
    const aS = parseCell(iAs)
    const aE = parseCell(iAe)
    const d0 = Math.min(ps.d, pe.d)
    const d1 = Math.max(ps.d, pe.d)
    out.push({
      task,
      plan: { y: ps.y, m: ps.m, d0, d1 },
      actual:
        aS && aE
          ? {
              y: aS.y,
              m: aS.m,
              d0: Math.min(aS.d, aE.d),
              d1: Math.max(aS.d, aE.d),
            }
          : null,
    })
  }
  return out
}

async function extractFromFile(tradeId, file) {
  const trade = tradeSites.value.find((t) => t.id === tradeId)
  const label = trade?.label ?? tradeId
  const name = file.name
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  let segments = []

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text()
    if (text.includes(',') && /\d{4}[./-]\d/.test(text)) {
      segments = parseCsvRows(text)
    }
    if (segments.length === 0) {
      const dates = parseDatesFromText(text)
      if (dates.length >= 2) {
        const task = firstLineTask(text, name.replace(/\.[^.]+$/, ''))
        const a = dates[0]
        const b = dates[dates.length - 1]
        segments = [
          {
            task,
            plan: { y: a.y, m: a.m, d0: a.d, d1: b.d },
            actual: null,
          },
        ]
      } else if (dates.length === 1) {
        const task = firstLineTask(text, name.replace(/\.[^.]+$/, ''))
        segments = [
          {
            task,
            plan: { y: dates[0].y, m: dates[0].m, d0: dates[0].d, d1: dates[0].d },
            actual: null,
          },
        ]
      }
    }
  }

  if (segments.length === 0) {
    segments = [mockSegmentFromFile(name, label)]
  }

  return { fileName: name, segments }
}

async function onTradeFiles(tradeId, evt) {
  const input = evt.target
  const files = input.files ? Array.from(input.files) : []
  if (!files.length) return
  const list = tradeUploads.value[tradeId] ?? []
  for (const file of files) {
    const row = await extractFromFile(tradeId, file)
    list.push(row)
  }
  tradeUploads.value = { ...tradeUploads.value, [tradeId]: [...list] }
  input.value = ''
}

const filteredTradeSites = computed(() => {
  if (activeCategoryChip.value === '전체') return tradeSites.value
  return tradeSites.value.filter((tr) => (tradeChipMap.value[tr.id] ?? '골조') === activeCategoryChip.value)
})

const workPlanGanttRows = computed(() => {
  const tl = ganttTimeline.value
  const rows = []
  for (const def of filteredTradeSites.value) {
    const uploads = tradeUploads.value[def.id] ?? []
    for (const up of uploads) {
      for (const seg of up.segments) {
               if (seg.plan.y !== tl.y || seg.plan.m !== tl.m) continue
        const ws = seg.plan.d0
        const we = seg.plan.d1
        let ps
        let pe
        if (tl.mode === 'month') {
          const last = tl.count
          ps = Math.max(1, Math.min(last, ws))
          pe = Math.max(1, Math.min(last, we))
          if (pe < ps) [ps, pe] = [pe, ps]
        } else {
          if (we < tl.chunkStart || ws > tl.chunkEnd) continue
          const o0 = Math.max(ws, tl.chunkStart)
          const o1 = Math.min(we, tl.chunkEnd)
          ps = o0 - tl.chunkStart + 1
          pe = o1 - tl.chunkStart + 1
          if (pe < ps) [ps, pe] = [pe, ps]
        }

        let actual = null
        if (seg.actual && seg.actual.y === tl.y && seg.actual.m === tl.m) {
          const aws = seg.actual.d0
          const awe = seg.actual.d1
          if (tl.mode === 'week') {
            if (awe < tl.chunkStart || aws > tl.chunkEnd) {
              actual = null
            } else {
              const a0 = Math.max(aws, tl.chunkStart)
              const a1 = Math.min(awe, tl.chunkEnd)
              let as_ = a0 - tl.chunkStart + 1
              let ae = a1 - tl.chunkStart + 1
              if (ae < as_) [as_, ae] = [ae, as_]
              actual = { s: as_, e: ae }
            }
          } else {
            const last = tl.count
            let as_ = Math.max(1, Math.min(last, aws))
            let ae = Math.max(1, Math.min(last, awe))
            if (ae < as_) [as_, ae] = [ae, as_]
            actual = { s: as_, e: ae }
          }
        }

        rows.push({
          name: seg.task,
          trade: def.label,
          source: up.fileName,
          plan: { s: ps, e: pe },
          actual,
        })
      }
    }
  }
  return rows
})

const allMonthRowsForEmptyCheck = computed(() => {
  const y = planViewYear.value
  const m = planViewMonth.value
  let n = 0
  for (const def of filteredTradeSites.value) {
    const uploads = tradeUploads.value[def.id] ?? []
    for (const up of uploads) {
      for (const seg of up.segments) {
        if (seg.plan.y === y && seg.plan.m === m) n++
      }
    }
  }
  return n
})

function barLeftPct(s, total) {
  return ((s - 1) / total) * 100
}

function barWidthPct(s, e, total) {
  return ((e - s + 1) / total) * 100
}

const isModalOpen = ref(false)
const modalFileInput = ref(null)
const modalForm = ref({
  category: '골조공사',
  workDate: '',
  reportFile: null,
  detailSummary: '',
  remarks: '',
})

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  modalForm.value = {
    category: '골조공사',
    workDate: '',
    reportFile: null,
    detailSummary: '',
    remarks: '',
  }
}

function openModalFilePicker() {
  modalFileInput.value?.click()
}

function onModalFileChange(evt) {
  const input = evt.target
  modalForm.value.reportFile = input.files?.[0] ?? null
}

function mapModalCategoryToChip(category) {
  if (category === '골조공사') return '골조'
  if (category === '내장공사') return '내장'
  if (category === '전기설비') return '설비'
  return '골조'
}

function resolveTradeIdFromModalCategory(category) {
  const chip = mapModalCategoryToChip(category)
  const target = tradeSites.value.find((tr) => (tradeChipMap.value[tr.id] ?? '골조') === chip)
  return target?.id ?? tradeSites.value[0]?.id ?? 'steel'
}

async function submitModalUpload() {
  if (!modalForm.value.reportFile) {
    closeModal()
    return
  }
  const tradeId = resolveTradeIdFromModalCategory(modalForm.value.category)
  const row = await extractFromFile(tradeId, modalForm.value.reportFile)
  const list = tradeUploads.value[tradeId] ?? []
  list.push(row)
  tradeUploads.value = { ...tradeUploads.value, [tradeId]: [...list] }

  console.log('[WorkPlanView] modal upload', {
    category: modalForm.value.category,
    workDate: modalForm.value.workDate,
    file: modalForm.value.reportFile?.name ?? '',
    detailSummary: modalForm.value.detailSummary,
    remarks: modalForm.value.remarks,
  })

  closeModal()
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <LayoutDashboard class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
              {{ T.kicker }}
            </p>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          </div>
        </div>
        <div
          class="flex flex-wrap items-end gap-3 rounded-2xl border border-forena-100/80 bg-white/80 p-3 shadow-sm"
        >
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-bold uppercase tracking-wide text-forena-500">{{
              T.monthPick
            }}</span>
            <div class="flex gap-2">
              <select
                v-model.number="planViewYear"
                class="rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm font-semibold text-forena-900"
              >
                <option v-for="y in [2024, 2025, 2026, 2027]" :key="y" :value="y">{{ y }}</option>
              </select>
              <select
                v-model.number="planViewMonth"
                class="rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm font-semibold text-forena-900"
              >
                <option v-for="mo in 12" :key="mo" :value="mo">{{ mo }}{{ '월' }}</option>
              </select>
            </div>
          </label>
        </div>
      </div>
    </div>

    <p
      class="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900"
    >
      {{ T.demoNote }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
      <div class="flex flex-wrap gap-2 rounded-xl border border-forena-100 bg-forena-50/40 p-1.5">
        <button
          v-for="chip in categoryChips"
          :key="chip"
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-bold transition"
          :class="
            activeCategoryChip === chip
              ? 'bg-gradient-to-r from-forena-700 to-forena-900 text-white shadow-sm'
              : 'text-forena-600 hover:bg-white'
          "
          @click="activeCategoryChip = chip"
        >
          {{ chip }}
        </button>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-forena-600 hover:to-forena-800"
        @click="openModal"
      >
        <Upload class="h-4 w-4" />
        {{ T.uploadCta }}
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div
        class="flex flex-col gap-3 border-b border-forena-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
        <div class="flex flex-wrap items-center gap-2">
          <CalendarRange class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">{{ T.sectionSchedule }}</h2>
          <span class="rounded-lg bg-forena-100 px-2 py-0.5 text-[10px] font-bold text-forena-600">
            {{ planViewYear }}.{{ String(planViewMonth).padStart(2, '0') }}
            <template v-if="scheduleTab === 'week' && ganttTimeline.chunkLabel">
              · {{ ganttTimeline.chunkLabel }}
            </template>
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-1 rounded-xl border border-forena-100 bg-forena-50/50 p-1">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
              :class="
                scheduleTab === 'month'
                  ? 'bg-gradient-to-r from-forena-700 to-forena-900 text-white shadow-sm'
                  : 'text-forena-600 hover:bg-white'
              "
              @click="scheduleTab = 'month'"
            >
              {{ T.tabMonth }}
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
              :class="
                scheduleTab === 'week'
                  ? 'bg-gradient-to-r from-forena-700 to-forena-900 text-white shadow-sm'
                  : 'text-forena-600 hover:bg-white'
              "
              @click="scheduleTab = 'week'"
            >
              {{ T.tabWeek }}
            </button>
          </div>
          <label
            v-if="scheduleTab === 'week'"
            class="flex items-center gap-2 text-[11px] font-semibold text-forena-700"
          >
            <span class="text-forena-500">{{ T.weekOfMonth }}</span>
            <select
              v-model.number="planWeekIndex"
              class="rounded-lg border border-forena-200 bg-white px-2 py-1 text-xs font-bold text-forena-900"
            >
              <option v-for="(ch, ci) in monthWeekChunks" :key="ci" :value="ci">
                {{ ci + 1 }}주차 ({{ ch.label }})
              </option>
            </select>
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 sm:ml-auto sm:w-full sm:justify-end lg:w-auto">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-6 shrink-0 rounded-full bg-blue-600" /> {{ T.legendPlan }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-6 shrink-0 rounded-full bg-red-600" /> {{ T.legendActual }}
          </span>
        </div>
      </div>

      <div
        v-if="!allMonthRowsForEmptyCheck"
        class="px-5 py-16 text-center text-sm text-slate-500"
      >
        {{ T.noExtract }}
      </div>
      <div
        v-else-if="!workPlanGanttRows.length && scheduleTab === 'week'"
        class="px-5 py-16 text-center text-sm text-slate-500"
      >
        {{ T.weekNoBars }}
      </div>
      <div v-else class="overflow-x-auto">
        <div class="min-w-[880px] px-5 py-4">
          <div
            class="flex gap-3 border-b border-forena-100 pb-2 text-[10px] font-bold text-forena-500"
          >
            <div class="w-[240px] shrink-0 pl-1">{{ T.colTask }} / {{ T.colType }}</div>
            <div
              class="grid min-w-0 flex-1"
              :style="{ gridTemplateColumns: `repeat(${ganttTimeline.count}, minmax(0, 1fr))` }"
            >
              <div
                v-for="(lab, idx) in ganttTimeline.labels"
                :key="idx"
                class="border-l border-forena-100 px-0.5 text-center tabular-nums"
              >
                {{ lab }}
              </div>
            </div>
          </div>

          <div
            v-for="(row, ri) in workPlanGanttRows"
            :key="ri"
            class="flex gap-3 border-b border-forena-50 py-3"
          >
            <div class="w-[240px] shrink-0 min-w-0 pl-1 pr-2">
              <p class="truncate text-sm font-semibold text-forena-900">{{ row.name }}</p>
              <p class="truncate text-[11px] text-slate-500">{{ row.trade }}</p>
              <p class="mt-0.5 truncate text-[10px] text-slate-400" :title="row.source">
                {{ T.sourceDoc }}: {{ row.source }}
              </p>
            </div>
            <div class="relative min-h-[44px] min-w-0 flex-1">
              <div
                class="absolute inset-0 grid h-full"
                :style="{ gridTemplateColumns: `repeat(${ganttTimeline.count}, minmax(0, 1fr))` }"
              >
                <div
                  v-for="n in ganttTimeline.count"
                  :key="n"
                  class="border-r border-forena-100/70 last:border-r-0"
                />
              </div>
              <div class="relative h-full min-h-[44px] w-full px-0.5">
                <div
                  class="pointer-events-none absolute top-[30%] h-1.5 -translate-y-1/2 rounded-full bg-blue-600"
                  :style="{
                    left: barLeftPct(row.plan.s, ganttTimeline.count) + '%',
                    width: barWidthPct(row.plan.s, row.plan.e, ganttTimeline.count) + '%',
                  }"
                />
                <div
                  v-if="row.actual"
                  class="pointer-events-none absolute top-[52%] h-1.5 -translate-y-1/2 rounded-full bg-red-600"
                  :style="{
                    left: barLeftPct(row.actual.s, ganttTimeline.count) + '%',
                    width: barWidthPct(row.actual.s, row.actual.e, ganttTimeline.count) + '%',
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-4 py-2.5 sm:px-5 sm:py-3">
        <div class="flex items-center gap-2">
          <BarChart3 class="h-4 w-4 text-flare-600" />
          <h3 class="text-sm font-bold text-forena-900">{{ T.secProgress }}</h3>
        </div>
        <p class="mt-1 text-[11px] text-slate-600">{{ T.progressVizSub }}</p>
      </div>

      <div class="grid gap-5 p-4 sm:p-5 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8 xl:p-6">
        <div
          class="rounded-xl border border-forena-100 bg-gradient-to-r from-forena-50/80 to-flare-50/40 p-3.5 sm:p-4"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <p class="text-xs font-bold uppercase tracking-wide text-forena-500">{{ T.overall }}</p>
            <p class="text-2xl font-bold tabular-nums text-forena-900 sm:text-3xl">
              {{ overallProgress }}%
            </p>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-forena-100 sm:h-3.5">
            <div
              class="h-full rounded-full bg-gradient-to-r from-forena-600 to-flare-500 transition-all"
              :style="{ width: overallProgress + '%' }"
            />
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-3 flex items-center gap-1 text-xs font-bold text-forena-500">
            <MapPin class="h-3.5 w-3.5" />
            {{ T.progressViz }}
          </p>
          <ul class="grid gap-3">
            <li v-for="(item, idx) in progressByCategory" :key="idx" class="min-w-0">
              <div class="flex justify-between gap-2 text-xs font-semibold text-forena-800">
                <span class="min-w-0 truncate">{{ item.name }}</span>
                <span class="shrink-0 tabular-nums text-flare-700">{{ item.pct }}%</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-forena-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-forena-500 to-flare-400"
                  :style="{ width: item.pct + '%' }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-2xl rounded-2xl border border-forena-100/90 bg-white p-6 shadow-card">
          <h3 class="text-base font-bold text-forena-900">공정 계획서 업로드</h3>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-xs font-bold uppercase tracking-wide text-forena-600">공종 선택</span>
              <select
                v-model="modalForm.category"
                class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900"
              >
                <option value="골조공사">골조공사</option>
                <option value="내장공사">내장공사</option>
                <option value="전기설비">전기설비</option>
              </select>
            </label>

            <label class="block space-y-2">
              <span class="text-xs font-bold uppercase tracking-wide text-forena-600">작업 일자</span>
              <input
                v-model="modalForm.workDate"
                type="date"
                class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900"
              />
            </label>
          </div>

          <div class="mt-4">
            <span class="block text-xs font-bold uppercase tracking-wide text-forena-600">파일 첨부</span>
            <input
              ref="modalFileInput"
              type="file"
              class="sr-only"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg"
              @change="onModalFileChange"
            />
            <label
              class="mt-2 flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/40 px-4 py-6 transition hover:border-flare-400 hover:bg-flare-50/30"
              @click.prevent="openModalFilePicker"
            >
              <Upload class="h-6 w-6 text-forena-400" />
              <span class="text-sm font-bold text-forena-700">PDF, JPG 파일 선택</span>
              <span class="text-xs text-slate-500">{{ modalForm.reportFile?.name || '선택된 파일 없음' }}</span>
            </label>
          </div>

          <label class="mt-4 block space-y-2">
            <span class="text-xs font-bold uppercase tracking-wide text-forena-600">세부 내역</span>
            <input
              v-model="modalForm.detailSummary"
              type="text"
              class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 placeholder:text-slate-400"
              placeholder="세부 내역을 입력하세요"
            />
          </label>

          <label class="mt-4 block space-y-2">
            <span class="text-xs font-bold uppercase tracking-wide text-forena-600">비고</span>
            <textarea
              v-model="modalForm.remarks"
              rows="4"
              class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 placeholder:text-slate-400"
              placeholder="특이사항(비고)을 입력하세요"
            />
          </label>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-forena-300 bg-white px-4 py-2 text-sm font-bold text-forena-800 transition hover:bg-forena-50"
              @click="closeModal"
            >
              취소(Cancel)
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-forena-600 hover:to-forena-800"
              @click="submitModalUpload"
            >
              업로드(Upload)
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>