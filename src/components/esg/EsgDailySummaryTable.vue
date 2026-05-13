<script setup>
import { ArrowUpRight, Medal } from 'lucide-vue-next'

defineProps({
  currentSite: {
    type: Object,
    required: true,
  },
  siteZones: {
    type: Array,
    default: () => [],
  },
})

function levelTone(level) {
  if (level === '경고' || level === '위험') return 'bg-rose-100 text-rose-800 border-rose-200'
  if (level === '주의' || level === '관리' || level === '대기') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}
</script>

<template>
  <section class="rounded-2xl border border-forena-100 bg-white p-5 shadow-card">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wide text-forena-500">일일 ESG 기록</p>
        <h2 class="mt-1 text-xl font-black text-forena-900">현장 ESG 성과 요약</h2>
      </div>
      <span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <ArrowUpRight class="h-3.5 w-3.5" />
        {{ currentSite.snapshotSaved ? `${currentSite.shortName} 현장 ESG 스냅샷 반영` : `${currentSite.shortName} 현장 ESG 계산 결과` }}
      </span>
    </div>

    <div class="mt-5 overflow-x-auto">
      <table class="w-full min-w-[760px] text-sm">
        <thead>
          <tr class="border-b border-forena-100 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">
            <th class="py-3 pr-4">구분</th>
            <th class="py-3 pr-4">대상</th>
            <th class="py-3 pr-4">ESG 점수</th>
            <th class="py-3 pr-4">레벨</th>
            <th class="py-3 pr-4">주요 기여</th>
            <th class="py-3 text-right">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="zone in siteZones"
            :key="zone.id"
            class="border-b border-forena-50 transition hover:bg-forena-50/40"
          >
            <td class="py-3 pr-4">
              <span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                <Medal class="h-3 w-3" />
                {{ zone.rank }}위
              </span>
            </td>
            <td class="py-3 pr-4">
              <p class="font-bold text-forena-900">{{ zone.name }}</p>
              <p class="mt-0.5 text-[11px] text-forena-500">{{ zone.type }}</p>
            </td>
            <td class="py-3 pr-4 font-black tabular-nums text-emerald-800">{{ zone.score }}</td>
            <td class="py-3 pr-4">
              <span class="rounded-full border border-forena-200 bg-white px-2 py-0.5 text-[11px] font-bold text-forena-700">
                Lv.{{ zone.level }}
              </span>
            </td>
            <td class="py-3 pr-4 text-xs text-forena-600">
              탄소 {{ zone.carbon }}kg · 전력 {{ zone.powerSaving }}kWh · 리스크 {{ zone.risk }}건
            </td>
            <td class="py-3 text-right">
              <span class="rounded-full border px-2.5 py-1 text-[11px] font-bold" :class="levelTone(zone.status)">
                {{ zone.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
