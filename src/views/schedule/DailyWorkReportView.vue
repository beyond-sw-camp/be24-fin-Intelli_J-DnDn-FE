<script setup>
import { computed, ref, watch } from 'vue'
import {
  Calendar,
  Printer,
  Send,
  CloudRain,
  Wind,
  Plus,
  X,
  ChevronDown,
} from 'lucide-vue-next'

const API_BASE_URL = 'http://localhost:8081'

const T = {
  titleSuffix: ' 작업 일보',
  print: '일보 출력',
  approve: '일보 결재 / 전송',
  exportPdf: 'PDF 다운로드',
  exportExcel: 'EXCEL 다운로드',
  weatherTitle: '금일 기상 및 특이사항 (이슈)',
  am: '오전',
  pm: '오후',
  safetyTitle: '투입 총괄 및 안전 관리',
  totalWorkers: '금일 투입 총원',
  manDaysSum: '확정 공수 합계',
  newHireEdu: '신규 채용자 교육',
  safetyAcc: '안전 사고',
  nearMiss: '아차사고',
  tableTitle: '구역별 / 공종별 주요 작업 내용',
  colArea: '작업 구역',
  colTrade: '공종 / 협력사',
  colHead: '인원',
  colWork: '금일 작업 내용',
  addWork: '주요 작업 추가',
  modalTitle: '주요 작업 등록',
  sendModalTitle: '일보 결재 / 전송',
  cancel: '취소',
  save: '등록',
  sendMail: '전송',
  fArea: '작업 구역',
  fTrade: '공종 / 협력사',
  fCount: '인원',
  fDetail: '작업 내용',
  fSpecial: '특이사항',
  fAlert: '이상/취소 등 특이 사항 (빨간색 강조)',
  email: '수신 이메일',
  sendFormat: '첨부 형식',
  personUnit: '명',
  manUnit: '공수',
  caseUnit: '건',
  empty: '등록된 주요 작업이 없습니다.',
}

const reportDate = ref('2025-10-14')
const showAddModal = ref(false)
const showSendModal = ref(false)
const showExportMenu = ref(false)
const loading = ref(false)
const saving = ref(false)
const sending = ref(false)

const dateTitle = computed(() => {
  const [y, m, d] = reportDate.value.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일${T.titleSuffix}`
})

const weather = ref({
  am: { label: '비 (18°C)' },
  pm: { label: '흐림/강풍 (22°C)' },
  notes:
    '오전 우천으로 인하여 외부 토목 공사 전면 중단. 오후 바람 약화 후 실내 공종 중심 진행. 지하 주차장 배수 공사는 방수 가동 아래 제한적 진행.',
})

const summary = ref({
  totalPersonnel: 132,
  manDays: 124.5,
  newHire: '3명 (이수 완료)',
  accidents: 0,
  nearMiss: 1,
})

const workRows = ref([])

const workForm = ref({
  workArea: '',
  tradePartner: '',
  personnelCount: '',
  workContent: '',
  specialNote: '',
  highlight: false,
})

const sendForm = ref({
  email: '',
  format: 'pdf',
})

function mapRow(item) {
  return {
    id: item.idx,
    area: item.workArea,
    trade: item.tradePartner,
    personnel: item.personnelCount,
    detail: item.workContent,
    specialNote: item.specialNote,
    highlight: item.highlight,
  }
}

async function loadWorkRows() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklog/list?reportDate=${reportDate.value}`)
    if (!response.ok) {
      throw new Error('작업 일보 조회 실패')
    }

    const data = await response.json()
    workRows.value = Array.isArray(data.workList) ? data.workList.map(mapRow) : []
  } catch (error) {
    console.error(error)
    workRows.value = []
  } finally {
    loading.value = false
  }
}

async function loadTodayWeather() {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/today`)
    if (!response.ok) {
      throw new Error('금일 기상 조회 실패')
    }

    const data = await response.json()

    weather.value = {
      am: { label: data.amLabel || '비 (18°C)' },
      pm: { label: data.pmLabel || '흐림/강풍 (22°C)' },
      notes:
        data.notes ||
        '오전 우천으로 인하여 외부 토목 공사 전면 중단. 오후 바람 약화 후 실내 공종 중심 진행. 지하 주차장 배수 공사는 방수 가동 아래 제한적 진행.',
    }
  } catch (error) {
    console.error(error)
  }
}

watch(reportDate, loadWorkRows, { immediate: true })

loadTodayWeather()

function openAddModal() {
  workForm.value = {
    workArea: '',
    tradePartner: '',
    personnelCount: '',
    workContent: '',
    specialNote: '',
    highlight: false,
  }
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

function openSendModal() {
  sendForm.value = {
    email: '',
    format: 'pdf',
  }
  showSendModal.value = true
}

function closeSendModal() {
  showSendModal.value = false
}

async function submitWorkRow() {
  saving.value = true
  try {
    const payload = {
      reportDate: reportDate.value,
      workArea: workForm.value.workArea,
      tradePartner: workForm.value.tradePartner,
      personnelCount: Number(workForm.value.personnelCount),
      workContent: workForm.value.workContent,
      specialNote: workForm.value.specialNote,
      highlight: workForm.value.highlight,
    }

    const response = await fetch(`${API_BASE_URL}/api/worklog/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('주요 작업 등록 실패')
    }

    await loadWorkRows()
    closeAddModal()
    window.alert('주요 작업이 등록되었습니다.')
  } catch (error) {
    console.error(error)
    window.alert('주요 작업 등록에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

async function downloadReport(format) {
  showExportMenu.value = false

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/worklog/export?reportDate=${reportDate.value}&format=${format}`,
    )

    if (!response.ok) {
      throw new Error('파일 다운로드 실패')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const extension = format === 'excel' ? 'xlsx' : 'pdf'

    link.href = url
    link.download = `worklog_${reportDate.value}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    window.alert('일보 출력에 실패했습니다.')
  }
}

async function sendReportMail() {
  sending.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklog/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: sendForm.value.email,
        reportDate: reportDate.value,
        format: sendForm.value.format,
      }),
    })

    if (!response.ok) {
      throw new Error('메일 전송 실패')
    }

    closeSendModal()
    window.alert('메일 전송이 완료되었습니다.')
  } catch (error) {
    console.error(error)
    window.alert('메일 전송에 실패했습니다.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-10 print:space-y-4">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-6 shadow-card print:border-forena-200"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500 print:hidden"
      />
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <Calendar class="h-6 w-6" />
          </span>
          <div>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight md:text-2xl">{{ dateTitle }}</h1>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <p class="text-sm text-forena-600 tabular-nums">{{ reportDate }}</p>
              <input
                v-model="reportDate"
                type="date"
                class="rounded-xl border border-forena-200 px-3 py-2 text-sm text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 print:hidden">
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-800 shadow-sm transition hover:bg-forena-50"
              @click="showExportMenu = !showExportMenu"
            >
              <Printer class="h-4 w-4" />
              {{ T.print }}
              <ChevronDown class="h-4 w-4" />
            </button>

            <div
              v-if="showExportMenu"
              class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-forena-100 bg-white p-2 shadow-lg"
            >
              <button
                type="button"
                class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-forena-800 hover:bg-forena-50"
                @click="downloadReport('pdf')"
              >
                {{ T.exportPdf }}
              </button>
              <button
                type="button"
                class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-forena-800 hover:bg-forena-50"
                @click="downloadReport('excel')"
              >
                {{ T.exportExcel }}
              </button>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
            @click="openSendModal"
          >
            <Send class="h-4 w-4" />
            {{ T.approve }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <h2 class="border-b border-forena-100 pb-3 text-sm font-bold text-forena-900">{{ T.weatherTitle }}</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wide text-sky-700">{{ T.am }}</p>
            <div class="mt-2 flex items-center gap-2">
              <CloudRain class="h-8 w-8 text-sky-600" />
              <span class="text-sm font-semibold text-forena-900">{{ weather.am.label }}</span>
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wide text-slate-600">{{ T.pm }}</p>
            <div class="mt-2 flex items-center gap-2">
              <Wind class="h-8 w-8 text-slate-600" />
              <span class="text-sm font-semibold text-forena-900">{{ weather.pm.label }}</span>
            </div>
          </div>
        </div>
        <p class="mt-4 rounded-xl border border-forena-100 bg-forena-50/40 p-4 text-sm leading-relaxed text-forena-800">
          {{ weather.notes }}
        </p>
      </div>

      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <h2 class="border-b border-forena-100 pb-3 text-sm font-bold text-forena-900">{{ T.safetyTitle }}</h2>
        <ul class="mt-4 space-y-3">
          <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-forena-100 px-4 py-3">
            <span class="text-sm font-bold text-forena-700">{{ T.totalWorkers }}</span>
            <span class="text-lg font-bold tabular-nums text-forena-900">
              {{ summary.totalPersonnel }}{{ T.personUnit }}
            </span>
          </li>
          <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3">
            <span class="text-sm font-bold text-emerald-900">{{ T.manDaysSum }}</span>
            <span class="text-lg font-bold tabular-nums text-emerald-900">
              {{ summary.manDays }} {{ T.manUnit }}
            </span>
          </li>
          <li
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3"
          >
            <span class="text-sm font-bold text-sky-900">{{ T.newHireEdu }}</span>
            <span class="text-sm font-bold text-sky-950">{{ summary.newHire }}</span>
          </li>
          <li
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-4 py-3"
          >
            <span class="text-sm font-bold text-rose-900">{{ T.safetyAcc }} / {{ T.nearMiss }}</span>
            <span class="text-sm font-bold tabular-nums text-rose-950">
              {{ summary.accidents }}{{ T.caseUnit }} / {{ summary.nearMiss }}{{ T.caseUnit }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div
        class="flex flex-col gap-3 border-b border-forena-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 class="text-sm font-bold text-forena-900">{{ T.tableTitle }}</h2>
        <button
          type="button"
          class="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950 print:hidden"
          @click="openAddModal"
        >
          <Plus class="h-4 w-4" />
          {{ T.addWork }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wider text-forena-500"
          >
            <tr>
              <th class="px-5 py-4 font-semibold">{{ T.colArea }}</th>
              <th class="px-5 py-4 font-semibold">{{ T.colTrade }}</th>
              <th class="px-5 py-4 font-semibold">{{ T.colHead }}</th>
              <th class="px-5 py-4 font-semibold">{{ T.colWork }}</th>
            </tr>
          </thead>

          <tbody class="text-forena-800">
            <tr v-if="loading" class="border-b border-forena-50">
              <td colspan="4" class="px-5 py-6 text-center text-sm text-forena-500">
                불러오는 중입니다...
              </td>
            </tr>

            <tr v-else-if="workRows.length === 0" class="border-b border-forena-50">
              <td colspan="4" class="px-5 py-6 text-center text-sm text-forena-500">
                {{ T.empty }}
              </td>
            </tr>

            <tr
              v-else
              v-for="row in workRows"
              :key="row.id"
              class="border-b border-forena-50 transition hover:bg-flare-50/20"
            >
              <td class="px-5 py-4 align-top text-sm font-medium">{{ row.area }}</td>
              <td class="px-5 py-4 align-top text-xs font-semibold text-forena-700">{{ row.trade }}</td>
              <td class="px-5 py-4 align-top tabular-nums text-slate-700">{{ row.personnel }}</td>
              <td class="px-5 py-4 align-top text-sm leading-relaxed">
                <p :class="row.highlight ? 'font-semibold text-rose-600' : 'text-forena-900'">
                  {{ row.detail }}
                </p>
                <p
                  v-if="row.specialNote"
                  class="mt-2 text-xs font-medium"
                  :class="row.highlight ? 'text-rose-600' : 'text-forena-600'"
                >
                  특이사항: {{ row.specialNote }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-forena-900/40 p-4 backdrop-blur-sm sm:items-center print:hidden"
        @click.self="closeAddModal"
      >
        <div class="w-full max-w-lg rounded-2xl border border-forena-100 bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-forena-100 px-5 py-4">
            <h3 class="text-lg font-bold text-forena-900">{{ T.modalTitle }}</h3>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-500 hover:bg-forena-50"
              @click="closeAddModal"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form class="space-y-4 px-5 py-5" @submit.prevent="submitWorkRow">
            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.fArea }}</span>
              <input
                v-model="workForm.workArea"
                type="text"
                required
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.fTrade }}</span>
              <input
                v-model="workForm.tradePartner"
                type="text"
                required
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.fCount }}</span>
              <input
                v-model="workForm.personnelCount"
                type="number"
                min="0"
                required
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.fDetail }}</span>
              <textarea
                v-model="workForm.workContent"
                rows="3"
                required
                class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.fSpecial }}</span>
              <textarea
                v-model="workForm.specialNote"
                rows="2"
                class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="flex cursor-pointer items-start gap-2 rounded-xl border border-forena-100 bg-forena-50/50 p-3">
              <input v-model="workForm.highlight" type="checkbox" class="mt-1 rounded border-forena-300 text-flare-600" />
              <span class="text-xs font-medium text-forena-800">{{ T.fAlert }}</span>
            </label>

            <div class="flex justify-end gap-2 border-t border-forena-100 pt-4">
              <button
                type="button"
                class="rounded-xl border border-forena-200 px-4 py-2.5 text-sm font-bold text-forena-700 hover:bg-forena-50"
                @click="closeAddModal"
              >
                {{ T.cancel }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
              >
                {{ saving ? '등록 중...' : T.save }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showSendModal"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-forena-900/40 p-4 backdrop-blur-sm sm:items-center print:hidden"
        @click.self="closeSendModal"
      >
        <div class="w-full max-w-lg rounded-2xl border border-forena-100 bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-forena-100 px-5 py-4">
            <h3 class="text-lg font-bold text-forena-900">{{ T.sendModalTitle }}</h3>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-500 hover:bg-forena-50"
              @click="closeSendModal"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form class="space-y-4 px-5 py-5" @submit.prevent="sendReportMail">
            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.email }}</span>
              <input
                v-model="sendForm.email"
                type="email"
                required
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">{{ T.sendFormat }}</span>
              <select
                v-model="sendForm.format"
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              >
                <option value="pdf">PDF</option>
                <option value="excel">EXCEL</option>
              </select>
            </label>

            <div class="flex justify-end gap-2 border-t border-forena-100 pt-4">
              <button
                type="button"
                class="rounded-xl border border-forena-200 px-4 py-2.5 text-sm font-bold text-forena-700 hover:bg-forena-50"
                @click="closeSendModal"
              >
                {{ T.cancel }}
              </button>
              <button
                type="submit"
                :disabled="sending"
                class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
              >
                {{ sending ? '전송 중...' : T.sendMail }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
