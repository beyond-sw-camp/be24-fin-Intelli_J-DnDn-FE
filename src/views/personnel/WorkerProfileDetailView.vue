<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft,
  Pencil,
  Ban,
  Check,
  FileText,
  Plus,
  ClipboardList,
  MapPin,
  AlertTriangle,
} from 'lucide-vue-next'
import { getWorkerProfile } from '@/data/workerProfileMock'

const T = {
  title: '작업자 상세 프로필',
  edit: '정보 수정',
  restrict: '투입 제한 처리',
  approve: '투입 승인',
  contact: '연락처',
  emergency: '비상 연락망',
  blood: '혈액형',
  registered: '최초 등록일',
  tabDocs: '안전 및 서류 현황',
  tabAttendance: '최근 출결 이력',
  tabZone: '구역 배치 이력',
  tabSanction: '제재/주의 이력',
  docsSection: '안전교육 및 필수 서류',
  docView: '조회/재업로드',
  docAdd: '추가 서류 업로드',
  colDocTitle: '서류',
  colDocStatus: '상태',
  colDate: '일자',
  colClock: '출·퇴근',
  colMan: '공수',
  colSite: '현장',
  colZone: '구역',
  colNote: '비고',
  colType: '구분',
  colDesc: '내용',
  emptySanction: '등록된 이력이 없습니다.',
  notFound: '작업자를 찾을 수 없습니다.',
  backList: '목록으로',
  monthAcc: '당월 누적',
  manUnit: '공수',
  demo: '(데모)',
}

const route = useRoute()
const router = useRouter()

const profile = computed(() => getWorkerProfile(route.params.id))

const activeTab = ref('docs')

const deployBadgeClass = (v) => {
  if (v === 'ok') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
  if (v === 'warn') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
  if (v === 'block') return 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80'
  return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/80'
}

const docStatusClass = (v) => {
  if (v === 'done') return 'text-emerald-700 font-semibold'
  if (v === 'pending') return 'text-amber-700 font-semibold'
  return 'text-slate-600'
}

function goBack() {
  router.push({ name: 'siteWorkerManagement' })
}

function onEdit() {
  window.alert(`${T.edit} ${T.demo}`)
}

function onRestrict() {
  window.alert(`${T.restrict} ${T.demo}`)
}

function onApprove() {
  window.alert(`${T.approve} ${T.demo}`)
}

function onDocAction() {
  window.alert(`${T.docView} ${T.demo}`)
}

function onDocAdd() {
  window.alert(`${T.docAdd} ${T.demo}`)
}

const avatarLetter = computed(() => {
  const n = profile.value?.name
  return n ? n.charAt(0) : '?'
})
</script>

<template>
  <div v-if="profile" class="space-y-6 pb-10">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forena-200 bg-white text-forena-700 shadow-sm transition hover:bg-forena-50"
          :aria-label="T.backList"
          @click="goBack"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
        <h1 class="text-gradient-brand truncate text-xl font-bold tracking-tight md:text-2xl">{{ T.title }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-800 shadow-sm transition hover:bg-forena-50"
          @click="onEdit"
        >
          <Pencil class="h-4 w-4" />
          {{ T.edit }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-50"
          @click="onRestrict"
        >
          <Ban class="h-4 w-4" />
          {{ T.restrict }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forena-600 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-700 hover:to-forena-950"
          @click="onApprove"
        >
          <Check class="h-4 w-4" />
          {{ T.approve }}
        </button>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-12 lg:items-start">
      <aside class="lg:col-span-4">
        <div
          class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-6 shadow-card"
        >
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-forena-600 to-forena-900 text-3xl font-bold text-white shadow-lg ring-4 ring-flare-200/40"
            >
              {{ avatarLetter }}
            </div>
            <h2 class="mt-4 text-lg font-bold text-forena-900">{{ profile.name }}</h2>
            <p class="mt-1 text-sm text-slate-600">
              {{ profile.company }} <span class="text-slate-400">|</span> {{ profile.role }}
            </p>
            <span
              class="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold"
              :class="deployBadgeClass(profile.deployStatusVariant)"
            >
              {{ profile.deployStatus }}
            </span>
          </div>
          <dl class="mt-6 space-y-3 border-t border-forena-100 pt-6 text-sm">
            <div class="flex justify-between gap-2">
              <dt class="shrink-0 text-slate-500">{{ T.contact }}</dt>
              <dd class="font-medium tabular-nums text-forena-900">{{ profile.phone }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="shrink-0 text-slate-500">{{ T.emergency }}</dt>
              <dd class="font-medium tabular-nums text-forena-900">{{ profile.emergency }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="shrink-0 text-slate-500">{{ T.blood }}</dt>
              <dd class="font-bold text-rose-600">{{ profile.bloodType }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="shrink-0 text-slate-500">{{ T.registered }}</dt>
              <dd class="font-medium tabular-nums text-forena-900">{{ profile.registeredAt }}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section class="lg:col-span-8">
        <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
          <div class="flex flex-wrap gap-1 border-b border-forena-100 bg-forena-50/50 p-2">
            <button
              v-for="tab in [
                { id: 'docs', label: T.tabDocs, icon: FileText },
                { id: 'attendance', label: T.tabAttendance, icon: ClipboardList },
                { id: 'zone', label: T.tabZone, icon: MapPin },
                { id: 'sanction', label: T.tabSanction, icon: AlertTriangle },
              ]"
              :key="tab.id"
              type="button"
              class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm"
              :class="
                activeTab === tab.id
                  ? 'bg-white text-forena-900 shadow-sm ring-1 ring-forena-200/80'
                  : 'text-forena-600 hover:bg-white/70'
              "
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              {{ tab.label }}
            </button>
          </div>

          <div class="p-5 md:p-6">
            <div v-show="activeTab === 'docs'">
              <h3 class="text-sm font-bold text-forena-900">{{ T.docsSection }}</h3>
              <ul class="mt-4 divide-y divide-forena-100 rounded-xl border border-forena-100 bg-white">
                <li
                  v-for="(doc, i) in profile.documents"
                  :key="i"
                  class="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                >
                  <div class="flex min-w-0 items-start gap-3">
                    <FileText class="mt-0.5 h-5 w-5 shrink-0 text-flare-600" />
                    <div>
                      <p class="font-semibold text-forena-900">{{ doc.title }}</p>
                      <p class="mt-0.5 text-sm" :class="docStatusClass(doc.statusVariant)">{{ doc.status }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 text-sm font-bold text-flare-600 underline decoration-flare-300 underline-offset-2 hover:text-forena-800"
                    @click="onDocAction"
                  >
                    {{ T.docView }}
                  </button>
                </li>
              </ul>
              <button
                type="button"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-flare-300 bg-flare-50/30 py-3 text-sm font-bold text-forena-800 transition hover:border-flare-400 hover:bg-flare-50/60"
                @click="onDocAdd"
              >
                <Plus class="h-4 w-4 text-flare-600" />
                {{ T.docAdd }}
              </button>
            </div>

            <div v-show="activeTab === 'attendance'">
              <p class="text-sm font-bold text-emerald-800">
                {{ T.monthAcc }}:
                <span class="tabular-nums">{{ profile.monthTotalMan }}</span>
                {{ T.manUnit }}
              </p>
              <div class="mt-4 overflow-x-auto rounded-xl border border-forena-100">
                <table class="w-full min-w-[560px] text-left text-sm">
                  <thead class="border-b border-forena-100 bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                    <tr>
                      <th class="px-4 py-3">{{ T.colDate }}</th>
                      <th class="px-4 py-3">{{ T.colSite }}</th>
                      <th class="px-4 py-3">{{ T.colClock }}</th>
                      <th class="px-4 py-3">{{ T.colMan }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-forena-800">
                    <tr
                      v-for="(row, ri) in profile.attendanceRows"
                      :key="ri"
                      class="border-b border-forena-50 last:border-0"
                    >
                      <td class="px-4 py-3 tabular-nums text-xs text-slate-600">{{ row.date }}</td>
                      <td class="px-4 py-3 text-xs">{{ row.site }}</td>
                      <td class="px-4 py-3 font-mono text-xs">
                        <span class="font-semibold text-flare-700">{{ row.clockIn }}</span>
                        <span class="text-slate-400"> — </span>
                        <span>{{ row.clockOut }}</span>
                      </td>
                      <td class="px-4 py-3 font-semibold tabular-nums">{{ row.manDays }} {{ T.manUnit }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-show="activeTab === 'zone'">
              <div class="overflow-x-auto rounded-xl border border-forena-100">
                <table class="w-full min-w-[480px] text-left text-sm">
                  <thead class="border-b border-forena-100 bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                    <tr>
                      <th class="px-4 py-3">{{ T.colDate }}</th>
                      <th class="px-4 py-3">{{ T.colZone }}</th>
                      <th class="px-4 py-3">{{ T.colNote }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-forena-800">
                    <tr
                      v-for="(z, zi) in profile.zoneHistory"
                      :key="zi"
                      class="border-b border-forena-50 last:border-0"
                    >
                      <td class="px-4 py-3 tabular-nums text-xs text-slate-600">{{ z.date }}</td>
                      <td class="px-4 py-3 text-xs font-semibold">{{ z.zone }}</td>
                      <td class="px-4 py-3 text-xs">{{ z.note }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-show="activeTab === 'sanction'">
              <div
                v-if="!profile.sanctions || profile.sanctions.length === 0"
                class="rounded-xl border border-dashed border-forena-200 bg-forena-50/40 py-12 text-center text-sm text-slate-500"
              >
                {{ T.emptySanction }}
              </div>
              <ul v-else class="space-y-3">
                <li
                  v-for="(s, si) in profile.sanctions"
                  :key="si"
                  class="rounded-xl border border-forena-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-bold text-rose-700">{{ s.type }}</span>
                    <span class="text-[11px] tabular-nums text-slate-500">{{ s.date }}</span>
                  </div>
                  <p class="mt-1 text-sm text-forena-800">{{ s.description }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div
    v-else
    class="rounded-2xl border border-forena-100/90 bg-white/95 p-10 text-center shadow-card"
  >
    <p class="font-semibold text-forena-900">{{ T.notFound }}</p>
    <button
      type="button"
      class="mt-4 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white"
      @click="goBack"
    >
      {{ T.backList }}
    </button>
  </div>
</template>
