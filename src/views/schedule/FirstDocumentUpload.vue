<script setup>
import { ref, computed } from 'vue'
import {
  Upload, FileText, BrainCircuit, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Flag, Layers, X, Eye, Download, RefreshCw,
  ChevronRight, ArrowRight, Clock, Users, ShieldCheck, Info,
  FilePlus2, Trash2, FileWarning, Loader2, BarChart3, Calendar,
} from 'lucide-vue-next'
import router from "@/router/index.js";

// =====================================================
// 상수
// =====================================================
const DOC_TYPES = [
  {
    key: 'master',
    label: '마스터 공정표',
    desc: '전체 공사 일정을 담은 마스터 공정표입니다. AI가 작업 항목, 기간, 선후행 관계를 자동으로 추출합니다.',
    icon: 'spreadsheet',
    required: true,
    acceptedFormats: ['.xlsx', '.xls', '.pdf', '.mpp'],
    color: 'blue',
    aiCapabilities: ['작업 항목 자동 추출', '기간 산정', '선행/후속 관계 파악', 'CP 공정 식별'],
  },
  {
    key: 'milestone',
    label: '마일스톤 공정표',
    desc: '착공, 골조완료, 준공 등 주요 마일스톤 일정을 담은 문서입니다. AI가 마일스톤 목록과 기준일을 추출합니다.',
    icon: 'flag',
    required: false,
    acceptedFormats: ['.xlsx', '.xls', '.pdf', '.pptx'],
    color: 'amber',
    aiCapabilities: ['마일스톤 일자 추출', '영향도 분석', '연관 공정 매핑'],
  },
  {
    key: 'trade',
    label: '공종별 시공계획서',
    desc: '골조, 전기, 설비 등 공종별 상세 시공계획서입니다. AI가 공종별 세부 일정과 인원/장비 계획을 추출합니다.',
    icon: 'layers',
    required: false,
    acceptedFormats: ['.pdf', '.hwp', '.docx', '.xlsx'],
    color: 'teal',
    aiCapabilities: ['공종별 세부 일정', '인원/장비 계획', '위험 요소 식별'],
  },
]

// =====================================================
// 상태
// =====================================================
const uploads = ref({
  master:    { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  milestone: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  trade:     { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
})

const projectMeta = ref({
  siteName: '',
  projectName: '',
  startDate: '',
  endDate: '',
  manager: '',
})

const currentStep = ref(1)  // 1: 문서등록 | 2: AI분석중 | 3: 검토/확인
const analyzeAll = ref(false)
const showPreview = ref(null)  // 'master' | 'milestone' | 'trade' | null

// =====================================================
// 헬퍼
// =====================================================
const colorMap = {
  blue:  { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700', icon: 'text-sky-600', dragBorder: 'border-sky-400 bg-sky-50/40' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600', dragBorder: 'border-amber-400 bg-amber-50/40' },
  teal:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-600', dragBorder: 'border-emerald-400 bg-emerald-50/40' },
}

const hasAnyUpload = computed(() => Object.values(uploads.value).some(u => u.fileName))
const hasMaster    = computed(() => !!uploads.value.master.fileName)

const allDone = computed(() =>
    Object.values(uploads.value).filter(u => u.fileName).every(u => u.status === 'done')
)

function getStatusLabel(status) {
  return { idle: '대기', uploading: '업로드 중', analyzing: 'AI 분석 중', done: '분석 완료', error: '오류' }[status] ?? '대기'
}
function getStatusClass(status) {
  return {
    idle:      'bg-slate-100 text-slate-500',
    uploading: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    analyzing: 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
    done:      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    error:     'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  }[status] ?? 'bg-slate-100 text-slate-500'
}

// 파일 선택
function onFileSelect(typeKey, event) {
  const f = event.target.files?.[0]
  if (!f) return
  uploads.value[typeKey].file = f
  uploads.value[typeKey].fileName = f.name
  uploads.value[typeKey].status = 'idle'
  uploads.value[typeKey].error = ''
  event.target.value = ''
}

// 드래그 앤 드롭
function onDrop(typeKey, event) {
  event.preventDefault()
  const f = event.dataTransfer.files?.[0]
  if (!f) return
  uploads.value[typeKey].file = f
  uploads.value[typeKey].fileName = f.name
  uploads.value[typeKey].status = 'idle'
  uploads.value[typeKey].error = ''
}
function onDragOver(event) { event.preventDefault() }

// 파일 삭제
function removeFile(typeKey) {
  uploads.value[typeKey] = { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' }
}

// AI 분석 실행 (mock)
function runAnalysis(typeKey) {
  const u = uploads.value[typeKey]
  if (!u.fileName) return
  u.status = 'uploading'
  u.progress = 0

  const progressInterval = setInterval(() => {
    u.progress = Math.min(u.progress + Math.random() * 18, 90)
  }, 180)

  setTimeout(() => {
    clearInterval(progressInterval)
    u.status = 'analyzing'
    u.progress = 95
    setTimeout(() => {
      u.status = 'done'
      u.progress = 100
      u.result = getMockResult(typeKey)
      if (Object.values(uploads.value).filter(x => x.fileName).every(x => x.status === 'done')) {
        currentStep.value = 3
      }
    }, 1200)
  }, 1800)
}

function runAllAnalysis() {
  analyzeAll.value = true
  currentStep.value = 2
  DOC_TYPES.forEach(dt => {
    if (uploads.value[dt.key].fileName && uploads.value[dt.key].status === 'idle') {
      runAnalysis(dt.key)
    }
  })
}

function getMockResult(typeKey) {
  return {
    master:    { tasks: 10, cpTasks: 6, dateRange: '2025-03-01 ~ 2026-09-30', confidence: 91 },
    milestone: { milestones: 7, firstDate: '2025-03-01', lastDate: '2026-09-30', confidence: 88 },
    trade:     { trades: 3, tasks: 18, lowestConf: 72, confidence: 82 },
  }[typeKey]
}

// 다음 페이지로 이동 (데모)
function goToSchedule() {
  router.push("/site/schedule")
  alert('전체 공정표 페이지로 이동합니다. (데모)')
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-8">

    <!-- ============================================================ -->
    <!-- 상단: 페이지 헤더 + 단계 표시                                   -->
    <!-- ============================================================ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">최초 공정표 문서 등록</h1>
        <p class="mt-1 text-xs text-forena-500">
          마스터 공정표, 마일스톤 공정표, 공종별 시공계획서를 업로드하면 AI가 자동으로 분석하여 기준 공정표를 생성합니다.
        </p>
      </div>

      <!-- 단계 표시 -->
      <div class="flex items-center gap-1.5 ">
        <div v-for="(step, i) in ['문서 등록', 'AI 분석', '검토 확인']" :key="i"
             class="flex items-center gap-1.5">
          <div class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
               :class="currentStep === i + 1
              ? 'bg-forena-800 text-white'
              : currentStep > i + 1
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-forena-50 text-forena-400'">
            <CheckCircle2 v-if="currentStep > i + 1" class="h-3 w-3" />
            <span v-else class="h-4 w-4 flex items-center justify-center rounded-full text-[9px]"
                  :class="currentStep === i + 1 ? 'bg-white/20' : 'bg-forena-200 text-forena-500'">
              {{ i + 1 }}
            </span>
            {{ step }}
          </div>
          <ChevronRight v-if="i < 2" class="h-3.5 w-3.5 text-forena-300" />
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 안내 박스 — 분석 미완료 시                                      -->
    <!-- ============================================================ -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
          <Info class="h-5 w-5 text-flare-600" />
        </div>
        <div>
          <p class="text-sm font-bold text-forena-900 mb-1">공정표 문서 등록 안내</p>
          <div class="text-[11px] leading-relaxed text-forena-600 space-y-1">
            <p>① <strong>마스터 공정표</strong>(필수)를 먼저 업로드하세요. Excel(.xlsx), PDF, MS Project(.mpp) 형식을 지원합니다.</p>
            <p>② <strong>마일스톤 공정표</strong>를 추가하면 AI가 주요 이벤트 일정을 자동으로 추출합니다.</p>
            <p>③ <strong>공종별 시공계획서</strong>를 첨부하면 공종별 세부 일정과 인원/장비 계획이 반영됩니다.</p>
            <p>④ 모든 문서 업로드 후 <strong>전체 AI 분석 실행</strong>을 클릭하면 기준 공정표가 자동 생성됩니다.</p>
          </div>
        </div>
      </div>
    </div>


    <!-- ============================================================ -->
    <!-- 프로젝트 기본 정보 입력 + 전체 현황 + 액션                         -->
    <!-- ============================================================ -->
    <div class="gap-4 grid lg:grid-cols-2">
      <!-- 프로젝트 기본 정보 입력                                          -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <BarChart3 class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">프로젝트 기본 정보</h2>
          <span class="ml-1 text-[11px] text-forena-400">공정표를 등록하기 전에 현장 정보를 입력해주세요.</span>
        </div>
        <div class="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">현장명 <span class="text-rose-500">*</span></label>
            <input v-model="projectMeta.siteName" type="text" placeholder="예) 강남 복합개발 1공구"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
          </div>
          <div class="sm:col-span-1 lg:col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">공사명 <span class="text-rose-500">*</span></label>
            <input v-model="projectMeta.projectName" type="text" placeholder="예) 강남 복합개발 1공구 신축공사"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">공사 시작일 <span class="text-rose-500">*</span></label>
            <input v-model="projectMeta.startDate" type="date"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">공사 종료일 <span class="text-rose-500">*</span></label>
            <input v-model="projectMeta.endDate" type="date"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">현장 총책임자</label>
            <input v-model="projectMeta.manager" type="text" placeholder="예) 박현수"
                   class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400" />
          </div>
        </div>
      </div>

      <!-- 전체 현황 + 액션                                               -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <BrainCircuit class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">등록 현황</h2>
          </div>

          <div class="flex flex-wrap gap-2">
            <!-- 일괄 AI 분석 -->
            <button @click="runAllAnalysis"
                    :disabled="!hasAnyUpload || analyzeAll"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-flare-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-flare-700 disabled:opacity-50">
              <BrainCircuit class="h-3.5 w-3.5" />
              {{ analyzeAll ? 'AI 분석 중…' : '전체 AI 분석 실행' }}
            </button>

            <!-- 전체 공정표로 이동 -->
            <button @click="goToSchedule"
                    :disabled="!hasMaster"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900 disabled:opacity-40">
              <ArrowRight class="h-3.5 w-3.5" />
              전체 공정표로 이동
            </button>
          </div>
        </div>

        <!-- 현황 테이블 -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-xs">
            <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
            <tr>
              <th class="px-4 py-2 text-left">문서 유형</th>
              <th class="px-4 py-2 text-center">파일명</th>
              <th class="px-4 py-2 text-center">분석 상태</th>
              <th class="px-4 py-2 text-center">AI 신뢰도</th>
              <th class="px-4 py-2 text-center">액션</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
            <tr v-for="dt in DOC_TYPES" :key="dt.key" class="hover:bg-forena-50/30">
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <FileSpreadsheet v-if="dt.icon === 'spreadsheet'" class="h-3.5 w-3.5" :class="colorMap[dt.color].icon" />
                  <Flag v-else-if="dt.icon === 'flag'" class="h-3.5 w-3.5" :class="colorMap[dt.color].icon" />
                  <Layers v-else class="h-3.5 w-3.5" :class="colorMap[dt.color].icon" />
                  <span class="font-semibold text-forena-800">{{ dt.label }}</span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-center">
                <span v-if="uploads[dt.key].fileName" class="text-forena-700 font-medium">{{ uploads[dt.key].fileName }}</span>
                <span v-else class="text-slate-400 italic">미등록</span>
              </td>
              <td class="px-4 py-2.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <Loader2 v-if="['uploading','analyzing'].includes(uploads[dt.key].status)"
                           class="h-3 w-3 animate-spin text-sky-600" />
                  <CheckCircle2 v-else-if="uploads[dt.key].status === 'done'"
                                class="h-3 w-3 text-emerald-500" />
                  <FileWarning v-else-if="uploads[dt.key].status === 'error'"
                               class="h-3 w-3 text-rose-500" />
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="getStatusClass(uploads[dt.key].status)">
                      {{ getStatusLabel(uploads[dt.key].status) }}
                    </span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-center tabular-nums font-bold">
                  <span v-if="uploads[dt.key].result"
                        :class="uploads[dt.key].result.confidence >= 90 ? 'text-emerald-600' : uploads[dt.key].result.confidence >= 80 ? 'text-forena-700' : 'text-amber-600'">
                    {{ uploads[dt.key].result.confidence }}%
                  </span>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-4 py-2.5 text-center">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="uploads[dt.key].fileName && uploads[dt.key].status === 'idle'"
                          @click="runAnalysis(dt.key)"
                          class="rounded px-2 py-1 text-[10px] font-bold bg-flare-50 text-flare-700 hover:bg-flare-100">
                    분석 실행
                  </button>
                  <button v-if="uploads[dt.key].status === 'done'"
                          @click="runAnalysis(dt.key)"
                          class="rounded p-1 text-forena-500 hover:bg-forena-100">
                    <RefreshCw class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="uploads[dt.key].status === 'done'"
                          class="rounded p-1 text-forena-500 hover:bg-forena-100">
                    <Eye class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="uploads[dt.key].fileName"
                          @click="removeFile(dt.key)"
                          class="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 문서 업로드 카드 3종                                            -->
    <!-- ============================================================ -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div v-for="dt in DOC_TYPES" :key="dt.key"
           class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card flex flex-col">

        <!-- 카드 헤더 -->
        <div class="flex items-center gap-2.5 border-b border-forena-100 px-4 py-3"
             :class="colorMap[dt.color].bg">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl"
               :class="dt.color === 'blue' ? 'bg-sky-100' : dt.color === 'amber' ? 'bg-amber-100' : 'bg-emerald-100'">
            <FileSpreadsheet v-if="dt.icon === 'spreadsheet'" class="h-4 w-4" :class="colorMap[dt.color].icon" />
            <Flag v-else-if="dt.icon === 'flag'" class="h-4 w-4" :class="colorMap[dt.color].icon" />
            <Layers v-else class="h-4 w-4" :class="colorMap[dt.color].icon" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-bold text-forena-900">{{ dt.label }}</p>
              <span v-if="dt.required" class="rounded px-1 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700">필수</span>
              <span v-else class="rounded px-1 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500">선택</span>
            </div>
          </div>
          <!-- 상태 배지 -->
          <span class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                :class="getStatusClass(uploads[dt.key].status)">
            {{ getStatusLabel(uploads[dt.key].status) }}
          </span>
        </div>

        <div class="flex flex-1 flex-col p-4 gap-3">
          <!-- 설명 -->
          <p class="text-[11px] leading-relaxed text-forena-500">{{ dt.desc }}</p>

          <!-- 업로드 영역 -->
          <div v-if="!uploads[dt.key].fileName"
               class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition cursor-pointer"
               :class="colorMap[dt.color].dragBorder"
               @dragover="onDragOver"
               @drop="(e) => onDrop(dt.key, e)">
            <Upload class="h-6 w-6 mb-1.5" :class="colorMap[dt.color].icon" />
            <p class="text-xs font-semibold text-forena-700">파일을 끌어다 놓거나</p>
            <label class="mt-2 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition"
                   :class="dt.color === 'blue' ? 'bg-sky-600 hover:bg-sky-700' : dt.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'">
              파일 선택
              <input type="file" class="sr-only"
                     :accept="dt.acceptedFormats.join(',')"
                     @change="(e) => onFileSelect(dt.key, e)" />
            </label>
            <p class="mt-2 text-[11px] ">{{ dt.acceptedFormats.join(' · ') }}</p>
          </div>

          <!-- 파일 등록 후 -->
          <div v-else class="rounded-xl border border-forena-100 bg-forena-50/30 p-3">
            <!-- 파일 정보 -->
            <div class="flex items-center gap-2 mb-2">
              <FileText class="h-4 w-4 text-forena-500 shrink-0" />
              <p class="flex-1 min-w-0 truncate text-xs font-semibold text-forena-800">{{ uploads[dt.key].fileName }}</p>
              <button @click="removeFile(dt.key)" class="rounded p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                <X class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- 프로그레스 바 -->
            <div v-if="['uploading','analyzing'].includes(uploads[dt.key].status)" class="mb-2">
              <div class="flex items-center justify-between mb-1 text-[10px] text-forena-500">
                <span>{{ uploads[dt.key].status === 'uploading' ? '업로드 중…' : 'AI 분석 중…' }}</span>
                <span class="tabular-nums font-bold">{{ Math.round(uploads[dt.key].progress) }}%</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                <div class="h-full rounded-full transition-all duration-300"
                     :class="dt.color === 'blue' ? 'bg-sky-500' : dt.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'"
                     :style="{ width: uploads[dt.key].progress + '%' }" />
              </div>
            </div>

            <!-- 완료 결과 요약 -->
            <div v-if="uploads[dt.key].status === 'done' && uploads[dt.key].result"
                 class="grid grid-cols-2 gap-1.5 text-[10px]">
              <template v-if="dt.key === 'master'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">추출 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.tasks }}건</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">CP 공정</p>
                  <p class="font-bold text-rose-700">{{ uploads[dt.key].result.cpTasks }}건</p>
                </div>
                <div class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between">
                  <span class="text-forena-400">AI 신뢰도</span>
                  <span class="font-bold" :class="uploads[dt.key].result.confidence >= 90 ? 'text-emerald-600' : 'text-amber-600'">
                    {{ uploads[dt.key].result.confidence }}%
                  </span>
                </div>
              </template>
              <template v-else-if="dt.key === 'milestone'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">마일스톤</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.milestones }}개</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">AI 신뢰도</p>
                  <p class="font-bold text-emerald-600">{{ uploads[dt.key].result.confidence }}%</p>
                </div>
              </template>
              <template v-else>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">공종 수</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.trades }}종</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">세부 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.tasks }}건</p>
                </div>
                <div class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between">
                  <span class="text-forena-400">AI 신뢰도</span>
                  <span class="font-bold text-amber-600">{{ uploads[dt.key].result.confidence }}%</span>
                </div>
              </template>
            </div>

            <!-- 오류 -->
            <div v-if="uploads[dt.key].status === 'error'" class="rounded bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
              {{ uploads[dt.key].error || '분석 중 오류가 발생했습니다.' }}
            </div>

            <!-- 액션 버튼 -->
            <div class="flex gap-1.5 mt-2">
              <button v-if="uploads[dt.key].status === 'idle'" @click="runAnalysis(dt.key)"
                      class="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-white"
                      :class="dt.color === 'blue' ? 'bg-sky-600 hover:bg-sky-700' : dt.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'">
                <BrainCircuit class="h-3 w-3" /> AI 분석 실행
              </button>
              <button v-if="uploads[dt.key].status === 'done'" @click="runAnalysis(dt.key)"
                      class="flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-[11px] font-bold text-forena-600 hover:bg-forena-50">
                <RefreshCw class="h-3 w-3" /> 재분석
              </button>
              <button v-if="['idle','done','error'].includes(uploads[dt.key].status)"
                      class="flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-[11px] font-bold text-forena-600 hover:bg-forena-50">
                <Eye class="h-3 w-3" /> 미리보기
              </button>
            </div>
          </div>

          <!-- AI 기능 설명 -->
          <div class="mt-auto">
            <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">AI 분석 항목</p>
            <div class="flex flex-col gap-1">
              <div v-for="cap in dt.aiCapabilities" :key="cap" class="flex items-center gap-1.5 text-[11px] text-forena-600">
                <span class="h-1 w-1 shrink-0 rounded-full" :class="colorMap[dt.color].dot"></span>
                {{ cap }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 분석 완료 후 — 결과 요약 카드 (분석이 1개 이상 완료됐을 때)        -->
    <!-- ============================================================ -->
    <div v-if="allDone || Object.values(uploads).some(u => u.status === 'done')"
         class="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-card">
      <div class="flex items-center gap-2 border-b border-emerald-100 px-5 py-3">
        <CheckCircle2 class="h-4 w-4 text-emerald-600" />
        <h2 class="text-sm font-bold text-forena-900">AI 분석 결과 요약</h2>
        <span class="text-[11px] text-forena-400">— 전체 공정표 페이지에서 상세 검토가 가능합니다</span>
      </div>

      <div class="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <!-- 마스터 공정표 결과 -->
        <template v-if="uploads.master.result">
          <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
            <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">추출 작업 수</p>
            <p class="mt-2 text-2xl font-bold tabular-nums text-forena-900">
              {{ uploads.master.result.tasks }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
            </p>
            <p class="mt-1 text-[10px] text-slate-400">마스터 공정표 기준</p>
          </div>
          <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
            <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">CP 공정</p>
            <p class="mt-2 text-2xl font-bold tabular-nums text-rose-700">
              {{ uploads.master.result.cpTasks }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
            </p>
            <p class="mt-1 text-[10px] text-slate-400">크리티컬 패스</p>
          </div>
        </template>
        <template v-if="uploads.milestone.result">
          <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
            <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">마일스톤</p>
            <p class="mt-2 text-2xl font-bold tabular-nums text-amber-700">
              {{ uploads.milestone.result.milestones }}<span class="text-sm font-normal text-slate-400 ml-1">개</span>
            </p>
            <p class="mt-1 text-[10px] text-slate-400">마일스톤 공정표 기준</p>
          </div>
        </template>
        <template v-if="uploads.trade.result">
          <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
            <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">공종별 작업</p>
            <p class="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
              {{ uploads.trade.result.tasks }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
            </p>
            <p class="mt-1 text-[10px] text-slate-400">{{ uploads.trade.result.trades }}개 공종</p>
          </div>
        </template>
      </div>

      <div class="flex justify-end gap-2 border-t border-emerald-100 bg-emerald-50/30 px-5 py-3">
        <p class="flex-1 text-[11px] text-emerald-700">
          <CheckCircle2 class="inline h-3.5 w-3.5 mr-1" />
          AI 분석이 완료되었습니다. 전체 공정표 페이지에서 각 항목을 검토하고 기준 공정표를 확정해주세요.
        </p>
        <button @click="goToSchedule"
                class="inline-flex items-center gap-1.5 rounded-lg bg-forena-800 px-4 py-2 text-xs font-bold text-white hover:bg-forena-900">
          <ShieldCheck class="h-3.5 w-3.5" />
          전체 공정표 검토하기
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

  </div>
</template>