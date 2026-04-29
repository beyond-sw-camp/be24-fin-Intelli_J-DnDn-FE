<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  Trash2,
  Loader2,
  Pencil,
} from 'lucide-vue-next'
import { fetchPartner, updatePartner, evaluatePartner, deletePartner } from '@/api/partner'

const router = useRouter()
const route = useRoute()
const partnerId = route.params.id

const T = {
  kicker: '협력사 상세',
  badgeCustom: '맞춤 협력사',
  summaryCard: '요약',
  rep: '대표자',
  contact: '연락처',
  unitPrice: '계약 단가',
  unitPriceUnit: '원',
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
  evalScore: '총점',
  evalLast: '최근 평가',
  evalItems: '항목',
  evalSummary: '요약',
  evalAction: '평가하기',
  evalModalTitle: '협력사 평가 등록',
  evalModalDesc: '항목별 점수와 종합 의견을 입력하면 현재 평가 결과에 반영됩니다.',
  evalScoreUnit: '점',
  evalCommentPh: '품질, 안전, 일정, 소통 관점에서 종합 의견을 작성하세요.',
  evalCancel: '취소',
  evalSubmit: '평가 반영',
  person: '명',
  dot: '·',
  delete: '협력사 삭제',
  deleteConfirm: '정말로 이 협력사를 삭제하시겠습니까?',
  deleteOk: '협력사가 삭제되었습니다.',
  edit: '정보 수정',
  editTitle: '협력사 정보 수정',
  editOk: '협력사 정보가 수정되었습니다.',
  editFail: '협력사 정보 수정에 실패했습니다.',
  editFields: '필수 정보를 모두 입력해주세요.',
  labelName: '협력사명 *',
  labelBiz: '사업자 번호',
  labelRep: '대표자명',
  labelContact: '연락처',
  labelTrade: '담당 공종 *',
  labelUnit: '계약 단가 (원)',
  labelStart: '계약 시작일 *',
  labelEnd: '계약 종료일 *',
  cancel: '취소',
  save: '저장',
  loadFail: '협력사 정보를 불러오는데 실패했습니다.',
  evalFail: '평가 등록에 실패했습니다.',
  evalOk: '평가가 반영되었습니다.',
  evalEmpty: '아직 평가가 등록되지 않았습니다.',
  fileEmpty: '등록된 계약 서류가 없습니다.',
}

const isLoading = ref(false)
const isEvalSubmitting = ref(false)

// 백엔드 PartnerDto.Res 응답
const partner = ref(null)
const evaluation = ref(null)
const contractFiles = ref([])

// 평가 모달 상태
const showEvaluationModal = ref(false)
const evaluationDraft = ref({
  qualityScore: 0,
  safetyScore: 0,
  scheduleScore: 0,
  commScore: 0,
  summary: '',
})

// ----- 데이터 로딩 -----
const loadPartner = async () => {
  isLoading.value = true
  try {
    const data = await fetchPartner(partnerId)
    partner.value = data
    evaluation.value = data?.evaluation || null
    contractFiles.value = data?.contractFiles || []
  } catch (e) {
    console.error(e)
    alert(e.message || T.loadFail)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPartner)

// ----- 평가 모달 -----
const openEvaluationModal = () => {
  // 기존 평가가 있으면 그 값으로 채우고, 없으면 0으로 초기화
  if (evaluation.value) {
    evaluationDraft.value = {
      qualityScore: getItemScore('품질'),
      safetyScore: getItemScore('안전'),
      scheduleScore: getItemScore('일정'),
      commScore: getItemScore('소통'),
      summary: evaluation.value.summary || '',
    }
  } else {
    evaluationDraft.value = {
      qualityScore: 0,
      safetyScore: 0,
      scheduleScore: 0,
      commScore: 0,
      summary: '',
    }
  }
  showEvaluationModal.value = true
}

const getItemScore = (label) => {
  const item = evaluation.value?.items?.find((it) => it.label === label)
  return item?.score ?? 0
}

const submitEvaluation = async () => {
  isEvalSubmitting.value = true
  try {
    const payload = {
      qualityScore: clamp(evaluationDraft.value.qualityScore),
      safetyScore: clamp(evaluationDraft.value.safetyScore),
      scheduleScore: clamp(evaluationDraft.value.scheduleScore),
      commScore: clamp(evaluationDraft.value.commScore),
      summary: evaluationDraft.value.summary,
    }

    await evaluatePartner(partnerId, payload)
    showEvaluationModal.value = false

    // 갱신된 데이터 다시 불러오기
    await loadPartner()
    alert(T.evalOk)
  } catch (e) {
    console.error(e)
    alert(e.message || T.evalFail)
  } finally {
    isEvalSubmitting.value = false
  }
}

const clamp = (v) => {
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, n))
}

// ----- 정보 수정 -----
const showEditDrawer = ref(false)
const isEditSubmitting = ref(false)
const editDraft = ref({
  name: '',
  bizNumber: '',
  repName: '',
  contact: '',
  trade: '',
  unitPrice: '',
  startDate: '',
  endDate: '',
})

const openEditDrawer = () => {
  if (!partner.value) return

  // 기존 값을 초안에 채워넣기
  // period는 "yyyy.MM.dd ~ yyyy.MM.dd" 형식이라 시작/종료를 분리해서 input[type=date]에 맞게 변환
  let startDate = ''
  let endDate = ''
  if (partner.value.period) {
    const [start, end] = partner.value.period.split(' ~ ')
    startDate = (start || '').replace(/\./g, '-')
    endDate = (end || '').replace(/\./g, '-')
  }

  editDraft.value = {
    name: partner.value.name || '',
    bizNumber: partner.value.bizNumber || '',
    repName: partner.value.repName || '',
    contact: partner.value.contact || '',
    trade: partner.value.trade || '',
    unitPrice: partner.value.unitPrice ?? '',
    startDate,
    endDate,
  }
  showEditDrawer.value = true
}

const submitEdit = async () => {
  if (
    !editDraft.value.name ||
    !editDraft.value.trade ||
    !editDraft.value.startDate ||
    !editDraft.value.endDate
  ) {
    alert(T.editFields)
    return
  }

  isEditSubmitting.value = true
  try {
    const payload = {
      name: editDraft.value.name,
      bizNumber: editDraft.value.bizNumber || null,
      repName: editDraft.value.repName || null,
      contact: editDraft.value.contact || null,
      trade: editDraft.value.trade,
      unitPrice: editDraft.value.unitPrice
        ? Number(String(editDraft.value.unitPrice).replace(/[^\d]/g, ''))
        : null,
      startDate: editDraft.value.startDate,
      endDate: editDraft.value.endDate,
    }

    await updatePartner(partnerId, payload)
    showEditDrawer.value = false
    await loadPartner()
    alert(T.editOk)
  } catch (e) {
    console.error(e)
    alert(e.message || T.editFail)
  } finally {
    isEditSubmitting.value = false
  }
}

// ----- 삭제 -----
const handleDelete = async () => {
  if (!confirm(T.deleteConfirm)) return
  try {
    await deletePartner(partnerId)
    alert(T.deleteOk)
    router.push('/hr/partners')
  } catch (e) {
    console.error(e)
    alert(e.message)
  }
}

const goBack = () => router.push('/hr/partners')

const statusBadgeClass = (s) => {
  if (s === '계약 중' || s === '계약 유지')
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
  if (s === '만료 예정') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
}

// 1000 단위 콤마 + 단위 (예: 250000 → "250,000원")
const formatUnitPrice = (v) => {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ko-KR') + T.unitPriceUnit
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- 로딩 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <Loader2 class="h-6 w-6 animate-spin text-forena-700" />
    </div>

    <template v-else-if="partner">
      <!-- 상단 헤더 -->
      <div
        class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-500 transition hover:text-forena-800"
              @click="goBack"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
                {{ T.kicker }}
              </p>
              <h2 class="text-gradient-brand text-xl font-bold tracking-tight">
                {{ partner.name }}
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                {{ partner.trade }} {{ T.dot }} {{ partner.bizNumber || '-' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 transition hover:bg-forena-50"
              @click="openEditDrawer"
            >
              <Pencil class="h-4 w-4" />
              {{ T.edit }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              @click="handleDelete"
            >
              <Trash2 class="h-4 w-4" />
              {{ T.delete }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-12">
        <!-- 메인 영역 -->
        <div class="space-y-5 lg:col-span-7 xl:col-span-8">
          <!-- 계약 서류 -->
          <div
            class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
          >
            <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
              <FileText class="h-4 w-4 text-flare-600" />
              {{ T.contractDocs }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500">{{ T.fileList }}</p>
            <ul v-if="contractFiles.length > 0" class="mt-3 space-y-2">
              <li
                v-for="file in contractFiles"
                :key="file.idx"
                class="flex items-center justify-between gap-2 rounded-xl border border-forena-100 bg-forena-50/30 px-3 py-2"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <FileText
                    v-if="(file.fileName || '').includes('pdf')"
                    class="h-4 w-4 shrink-0 text-rose-500"
                  />
                  <ImageIcon v-else class="h-4 w-4 shrink-0 text-sky-600" />
                  <div class="min-w-0">
                    <p class="truncate text-xs font-semibold text-forena-900">
                      {{ file.fileName }}
                    </p>
                    <p class="text-[10px] text-slate-500">{{ file.fileSize }}</p>
                  </div>
                </div>
                <a
                  :href="file.fileUrl"
                  target="_blank"
                  rel="noopener"
                  class="shrink-0 rounded-lg p-1.5 text-forena-500 transition hover:bg-white hover:text-forena-800"
                >
                  <Download class="h-4 w-4" />
                </a>
              </li>
            </ul>
            <p v-else class="mt-4 text-center text-xs text-slate-400">{{ T.fileEmpty }}</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
          <!-- 요약 -->
          <div
            class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card sm:p-5"
          >
            <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
              {{ T.summaryCard }}
            </h3>
            <dl class="mt-3 space-y-3 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-slate-500">{{ T.rep }}</dt>
                <dd class="font-semibold text-forena-900">{{ partner.repName || '-' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="flex items-center gap-1 text-slate-500">
                  <Phone class="h-3.5 w-3.5 shrink-0 opacity-70" /> {{ T.contact }}
                </dt>
                <dd class="font-semibold tabular-nums text-forena-900">
                  {{ partner.contact || '-' }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-slate-500">{{ T.period }}</dt>
                <dd class="font-semibold text-xs text-forena-900">{{ partner.period || '-' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-slate-500">{{ T.unitPrice }}</dt>
                <dd class="font-semibold tabular-nums text-forena-900">
                  {{ formatUnitPrice(partner.unitPrice) }}
                </dd>
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

          <!-- 평가 -->
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

            <template v-if="evaluation">
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
                    {{ evaluation.totalScore }}{{ T.evalScoreUnit }}
                  </p>
                </div>
              </div>
              <p class="mt-2 text-[10px] text-slate-500">
                {{ T.evalLast }} {{ T.dot }} {{ evaluation.lastEvaluatedAt }}
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
                  <span class="shrink-0 font-bold tabular-nums text-forena-900">{{
                    it.score
                  }}</span>
                </div>
              </div>
              <p class="mt-3 text-[10px] font-bold uppercase tracking-wide text-forena-500">
                {{ T.evalSummary }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ evaluation.summary }}</p>
            </template>
            <p v-else class="mt-4 text-center text-xs text-slate-400">{{ T.evalEmpty }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 평가 모달 -->
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
              <label class="rounded-2xl border border-forena-100 bg-forena-50/35 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-forena-900">품질</span>
                  <span class="text-[11px] font-bold text-forena-400"
                    >0-100 {{ T.evalScoreUnit }}</span
                  >
                </div>
                <input
                  v-model.number="evaluationDraft.qualityScore"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-3 w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </label>
              <label class="rounded-2xl border border-forena-100 bg-forena-50/35 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-forena-900">안전</span>
                  <span class="text-[11px] font-bold text-forena-400"
                    >0-100 {{ T.evalScoreUnit }}</span
                  >
                </div>
                <input
                  v-model.number="evaluationDraft.safetyScore"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-3 w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </label>
              <label class="rounded-2xl border border-forena-100 bg-forena-50/35 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-forena-900">일정</span>
                  <span class="text-[11px] font-bold text-forena-400"
                    >0-100 {{ T.evalScoreUnit }}</span
                  >
                </div>
                <input
                  v-model.number="evaluationDraft.scheduleScore"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-3 w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </label>
              <label class="rounded-2xl border border-forena-100 bg-forena-50/35 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-forena-900">소통</span>
                  <span class="text-[11px] font-bold text-forena-400"
                    >0-100 {{ T.evalScoreUnit }}</span
                  >
                </div>
                <input
                  v-model.number="evaluationDraft.commScore"
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
              :disabled="isEvalSubmitting"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950 disabled:opacity-60"
              @click="submitEvaluation"
            >
              <span v-if="!isEvalSubmitting">{{ T.evalSubmit }}</span>
              <Loader2 v-else class="h-4 w-4 animate-spin" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 정보 수정 Drawer -->
    <Teleport to="body">
      <div
        v-if="showEditDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showEditDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl animate-[drawerIn_0.25s_ease-out]"
          @click.stop
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">{{ T.editTitle }}</h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
              @click="showEditDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-6 text-sm">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelName
                  }}</label>
                  <input
                    v-model="editDraft.name"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelBiz
                  }}</label>
                  <input
                    v-model="editDraft.bizNumber"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelRep
                  }}</label>
                  <input
                    v-model="editDraft.repName"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelContact
                  }}</label>
                  <input
                    v-model="editDraft.contact"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelTrade
                  }}</label>
                  <input
                    v-model="editDraft.trade"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelUnit
                  }}</label>
                  <input
                    v-model="editDraft.unitPrice"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelStart
                  }}</label>
                  <input
                    v-model="editDraft.startDate"
                    type="date"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelEnd
                  }}</label>
                  <input
                    v-model="editDraft.endDate"
                    type="date"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-4">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-700 transition hover:bg-forena-50"
              @click="showEditDrawer = false"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              :disabled="isEditSubmitting"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950 disabled:opacity-60"
              @click="submitEdit"
            >
              <span v-if="!isEditSubmitting">{{ T.save }}</span>
              <Loader2 v-else class="h-4 w-4 animate-spin" />
            </button>
          </div>
        </aside>
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
@keyframes drawerIn {
  from {
    transform: translateX(100%);
    opacity: 0.96;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
