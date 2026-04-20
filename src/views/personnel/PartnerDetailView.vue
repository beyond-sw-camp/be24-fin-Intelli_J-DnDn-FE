<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeft,
  Building2,
  Phone,
  FileText,
  Image as ImageIcon,
  Download,
  MapPin,
  Star,
  X,
} from 'lucide-vue-next'

const router = useRouter()

const partner = ref({
  name: '태양건설',
  repName: '김태양',
  contact: '010-1111-2222',
  workersCount: 145,
  period: '2025.01.01 ~ 2025.12.31',
  status: '계약 유지',
})

const workers = ref([
  {
    id: 1,
    name: '김동석',
    phone: '010-1234-5678',
    docStatus: '완료',
    status: '출근 전',
  },
  {
    id: 2,
    name: '이목수',
    phone: '010-9876-5432',
    docStatus: '완료',
    status: '출근 완료',
  },
  {
    id: 3,
    name: '박지훈',
    phone: '010-2345-6789',
    docStatus: '완료',
    status: '출근 완료',
  },
  {
    id: 4,
    name: '최수연',
    phone: '010-3456-7890',
    docStatus: '진행중',
    status: '출근 전',
  },
  {
    id: 5,
    name: '정해성',
    phone: '010-4567-8901',
    docStatus: '완료',
    status: '출근 완료',
  },
  {
    id: 6,
    name: '안영진',
    phone: '010-5678-9012',
    docStatus: '완료',
    status: '출근 전',
  },
  {
    id: 7,
    name: '조민재',
    phone: '010-6789-0123',
    docStatus: '대기',
    status: '출근 전',
  },
  {
    id: 8,
    name: '한지원',
    phone: '010-7890-1234',
    docStatus: '완료',
    status: '출근 완료',
  },
  {
    id: 9,
    name: '임성호',
    phone: '010-8901-2345',
    docStatus: '완료',
    status: '출근 완료',
  },
  {
    id: 10,
    name: '김나연',
    phone: '010-9012-3456',
    docStatus: '진행중',
    status: '출근 전',
  },
])

const deployedSites = ref([
  {
    id: 1,
    name: 'A구역 · 강남 재건축',
    current: 45,
    status: '운영 중',
  },
  {
    id: 2,
    name: 'B구역 · 판교 데이터센터',
    current: 20,
    status: '운영 중',
  },
])

const contractFiles = ref([
  {
    id: 1,
    name: '2025년도_하도급계약서.pdf',
    size: '2.4MB',
    date: '2025.01.05',
  },
  {
    id: 2,
    name: '사업자등록증_사본.jpg',
    size: '1.1MB',
    date: '2024.12.28',
  },
])

const evaluation = ref({
  grade: 'A',
  score: 92,
  lastDate: '2025.03.15',
  summary:
    '품질 및 일정 준수는 우수하나, 안전 교육 이수 유도 보완이 필요합니다.',
  items: [
    { label: '품질', score: 95 },
    { label: '안전', score: 88 },
    { label: '일정', score: 91 },
    { label: '소통', score: 94 },
  ],
})

const showEvaluationModal = ref(false)
const evaluationDraft = ref({
  items: evaluation.value.items.map((item) => ({ ...item })),
  summary: evaluation.value.summary,
})

const T = {
  kicker: '협력사 상세',
  badgeCustom: '맞춤 협력사',
  summaryCard: '요약',
  rep: '대표자',
  contact: '연락처',
  workers: '등록 근로자',
  contractState: '계약',
  period: '계약 기간',
  contractDocs: '계약 서류',
  fileList: '첨부 파일',
  workerList: '소속 근로자',
  workerTotal: '총',
  colName: '이름',
  colPhone: '연락처',
  colDoc: '교육/서류',
  colStatus: '상태',
  deployed: '투입 구역',
  deployingLine1: '현재',
  deployingLine2: '배치 중',
  evalSection: '협력사 평가',
  evalGrade: '등급',
  evalScore: '촜점',
  evalLast: '최근 평가',
  evalItems: '항목',
  evalSummary: '요약',
  evalAction: '평가하기',
  evalModalTitle: '협력사 평가 등록',
  evalModalDesc:
    '항목별 점수와 종합 의견을 입력하면 현재 평가 결과에 반영됩니다.',
  evalScoreUnit: '점',
  evalCommentPh:
    '품질, 안전, 일정, 소통 관점에서 종합 의견을 작성하세요.',
  evalCancel: '취소',
  evalSubmit: '평가 반영',
  person: '명',
  dot: '·',
}

const goBack = () => router.push('/hr/partners')

const statusBadgeClass = (s) => {
  if (s === '계약 유지')
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
  if (s === '정지') return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
}

const workerStatusClass = (s) => {
  if (s.includes('완료')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
  return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/70'
}

const openEvaluationModal = () => {
  evaluationDraft.value = {
    items: evaluation.value.items.map((item) => ({ ...item })),
    summary: evaluation.value.summary,
  }
  showEvaluationModal.value = true
}

const getEvaluationGrade = (score) => {
  if (score >= 95) return 'S'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  return 'C'
}

const submitEvaluation = () => {
  const sanitizedItems = evaluationDraft.value.items.map((item) => {
    const score = Number(item.score)

    return {
      ...item,
      score: Math.max(0, Math.min(100, Number.isNaN(score) ? 0 : score)),
    }
  })

  const averageScore = Math.round(
    sanitizedItems.reduce((sum, item) => sum + item.score, 0) / sanitizedItems.length,
  )

  evaluation.value = {
    grade: getEvaluationGrade(averageScore),
    score: averageScore,
    lastDate: new Date().toLocaleDateString('ko-KR').replace(/\s/g, ''),
    summary:
      evaluationDraft.value.summary.trim() || '평가 의견이 입력되지 않았습니다.',
    items: sanitizedItems,
  }

  showEvaluationModal.value = false
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- Hero -->
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/40 to-flare-50/20 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div class="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <button
            type="button"
            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forena-200/80 bg-white text-forena-700 shadow-sm transition hover:bg-forena-50 sm:mt-0"
            @click="goBack"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-forena-700 text-lg font-bold text-white shadow-md"
          >
            {{ partner.name.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-flare-600">
              {{ T.kicker }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <h1
                class="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight text-forena-900 sm:text-xl"
              >
                <Building2 class="h-5 w-5 shrink-0 text-flare-600 sm:h-6 sm:w-6" />
                <span class="truncate">{{ partner.name }}</span>
              </h1>
              <span
                class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="statusBadgeClass(partner.status)"
              >
                {{ partner.status }}
              </span>
            </div>
            <p class="mt-1 text-[11px] text-slate-500">{{ T.badgeCustom }}</p>
          </div>
        </div>
        <div
          class="flex shrink-0 flex-wrap gap-2 border-t border-forena-100/80 pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0"
        >
          <div
            class="rounded-xl border border-forena-100 bg-white/80 px-3 py-2 text-center shadow-sm sm:min-w-[5.5rem]"
          >
            <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
              {{ T.workers }}
            </p>
            <p class="mt-0.5 text-lg font-bold tabular-nums text-forena-900">
              {{ partner.workersCount }}{{ T.person }}
            </p>
          </div>
          <div
            class="min-w-0 flex-1 rounded-xl border border-forena-100 bg-white/80 px-3 py-2 shadow-sm sm:min-w-[10rem] sm:flex-initial"
          >
            <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
              {{ T.period }}
            </p>
            <p class="mt-0.5 truncate text-sm font-semibold text-forena-800">
              {{ partner.period }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main + sidebar -->
    <div class="grid gap-6 lg:grid-cols-12 lg:items-start">
      <div class="min-w-0 lg:col-span-7 xl:col-span-8">
        <div
          class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 bg-forena-50/50 px-4 py-3 sm:px-5"
          >
            <h2 class="text-sm font-bold text-forena-900">
              {{ T.workerList }}
              <span class="font-normal text-slate-500"
                >({{ T.workerTotal }} {{ workers.length }}{{ T.person }})</span
              >
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[420px] text-left text-sm">
              <thead
                class="border-b border-forena-100 bg-white text-[11px] font-bold uppercase tracking-wide text-forena-500"
              >
                <tr>
                  <th class="px-4 py-3 font-semibold sm:px-5">{{ T.colName }}</th>
                  <th class="px-4 py-3 font-semibold sm:px-5">{{ T.colPhone }}</th>
                  <th class="px-4 py-3 text-center font-semibold sm:px-5">{{ T.colDoc }}</th>
                  <th class="px-4 py-3 text-center font-semibold sm:px-5">{{ T.colStatus }}</th>
                </tr>
              </thead>
              <tbody class="text-forena-800">
                <tr
                  v-for="w in workers"
                  :key="w.id"
                  class="border-b border-forena-50 transition hover:bg-flare-50/20 last:border-0"
                >
                  <td class="px-4 py-3.5 font-semibold sm:px-5">{{ w.name }}</td>
                  <td class="px-4 py-3.5 tabular-nums text-slate-600 sm:px-5">{{ w.phone }}</td>
                  <td class="px-4 py-3.5 text-center text-xs font-medium text-emerald-700 sm:px-5">
                    {{ w.docStatus }}
                  </td>
                  <td class="px-4 py-3.5 text-center sm:px-5">
                    <span
                      class="inline-flex rounded-lg px-2 py-1 text-[10px] font-bold"
                      :class="workerStatusClass(w.status)"
                      >{{ w.status }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
        <div
          class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
        >
          <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
            {{ T.summaryCard }}
          </h3>
          <dl class="mt-3 space-y-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">{{ T.rep }}</dt>
              <dd class="font-semibold text-forena-900">{{ partner.repName }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="flex items-center gap-1 text-slate-500">
                <Phone class="h-3.5 w-3.5 shrink-0 opacity-70" /> {{ T.contact }}
              </dt>
              <dd class="font-semibold tabular-nums text-forena-900">{{ partner.contact }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-t border-forena-50 pt-3">
              <dt class="text-slate-500">{{ T.contractState }}</dt>
              <dd>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                  :class="statusBadgeClass(partner.status)"
                >
                  {{ partner.status }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div
            class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
          >
            <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
              <MapPin class="h-4 w-4 shrink-0 text-flare-600" />
              {{ T.deployed }}
            </h3>
            <ul class="mt-3 space-y-2">
              <li
                v-for="site in deployedSites"
                :key="site.id"
                class="rounded-xl border border-forena-100 bg-forena-50/40 p-2.5"
              >
                <p class="text-xs font-bold leading-snug text-forena-900">{{ site.name }}</p>
                <p class="mt-1 text-[10px] text-slate-600">
                  {{ T.deployingLine1 }} {{ site.current }}{{ T.person }} {{ T.deployingLine2 }}
                </p>
                <span
                  class="mt-1.5 inline-flex rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/60"
                  >{{ site.status }}</span
                >
              </li>
            </ul>
          </div>

          <div
            class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
                <Star class="h-4 w-4 shrink-0 text-amber-500" />
                {{ T.evalSection }}
              </h3>
              <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                @click="openEvaluationModal"
              >
                {{ T.evalAction }}
              </button>
            </div>
            <div
              class="mt-3 flex items-start justify-between gap-3 rounded-xl bg-gradient-to-br from-amber-50/80 to-flare-50/40 px-3 py-2.5 ring-1 ring-amber-100/60"
            >
              <div>
                <p class="text-[10px] font-bold text-forena-500">{{ T.evalGrade }}</p>
                <p class="text-2xl font-bold tabular-nums text-forena-900">
                  {{ evaluation.grade }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold text-forena-500">{{ T.evalScore }}</p>
                <p class="text-lg font-bold tabular-nums text-flare-700">
                  {{ evaluation.score }}{{ T.evalScoreUnit }}
                </p>
              </div>
            </div>
            <p class="mt-2 text-[10px] text-slate-500">
              {{ T.evalLast }} {{ T.dot }} {{ evaluation.lastDate }}
            </p>
            <p class="mt-3 text-[10px] font-bold uppercase tracking-wide text-forena-500">
              {{ T.evalItems }}
            </p>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <div
                v-for="(it, idx) in evaluation.items"
                :key="idx"
                class="flex items-center justify-between gap-1 rounded-lg border border-forena-100 bg-forena-50/30 px-2 py-1.5 text-[11px]"
              >
                <span class="truncate text-forena-700">{{ it.label }}</span>
                <span class="shrink-0 font-bold tabular-nums text-forena-900">{{ it.score }}</span>
              </div>
            </div>
            <p class="mt-3 text-[10px] font-bold uppercase tracking-wide text-forena-500">
              {{ T.evalSummary }}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ evaluation.summary }}</p>
          </div>
        </div>

        <div
          class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
        >
          <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
            <FileText class="h-4 w-4 text-flare-600" />
            {{ T.contractDocs }}
          </h3>
          <p class="mt-1 text-[10px] text-slate-500">{{ T.fileList }}</p>
          <ul class="mt-3 space-y-2">
            <li
              v-for="file in contractFiles"
              :key="file.id"
              class="flex items-center justify-between gap-2 rounded-xl border border-forena-100 bg-forena-50/30 px-3 py-2"
            >
              <div class="flex min-w-0 items-center gap-2">
                <FileText v-if="file.name.includes('pdf')" class="h-4 w-4 shrink-0 text-rose-500" />
                <ImageIcon v-else class="h-4 w-4 shrink-0 text-sky-600" />
                <div class="min-w-0">
                  <p class="truncate text-xs font-semibold text-forena-900">{{ file.name }}</p>
                  <p class="text-[10px] text-slate-500">
                    {{ file.size }} {{ T.dot }} {{ file.date }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-lg p-1.5 text-forena-500 transition hover:bg-white hover:text-forena-800"
              >
                <Download class="h-4 w-4" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showEvaluationModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-forena-950/35 p-4 backdrop-blur-[3px]"
        @click.self="showEvaluationModal = false"
      >
        <div
          class="w-full max-w-2xl overflow-hidden rounded-3xl border border-forena-100/90 bg-white shadow-2xl animate-[fadeUp_0.2s_ease-out]"
        >
          <div
            class="flex items-start justify-between gap-4 border-b border-forena-100 bg-gradient-to-r from-forena-50 to-flare-50/40 px-5 py-4 sm:px-6"
          >
            <div>
              <h2 class="text-lg font-bold text-forena-900">{{ T.evalModalTitle }}</h2>
              <p class="mt-1 text-xs text-slate-500">{{ T.evalModalDesc }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
              @click="showEvaluationModal = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="space-y-5 px-5 py-5 sm:px-6">
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="(item, idx) in evaluationDraft.items"
                :key="item.label"
                class="rounded-2xl border border-forena-100 bg-forena-50/35 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-forena-900">{{ item.label }}</span>
                  <span class="text-[11px] font-bold text-forena-400"
                    >0-100 {{ T.evalScoreUnit }}</span
                  >
                </div>
                <input
                  v-model.number="evaluationDraft.items[idx].score"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-3 w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </label>
            </div>

            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-wide text-forena-500">
                {{ T.evalSummary }}
              </p>
              <textarea
                v-model="evaluationDraft.summary"
                rows="4"
                :placeholder="T.evalCommentPh"
                class="w-full resize-none rounded-2xl border border-forena-200 bg-white px-4 py-3 text-sm leading-relaxed text-forena-900 outline-none transition placeholder:text-slate-400 focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-700 transition hover:bg-forena-50"
              @click="showEvaluationModal = false"
            >
              {{ T.evalCancel }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="submitEvaluation"
            >
              {{ T.evalSubmit }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes fadeUp {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
