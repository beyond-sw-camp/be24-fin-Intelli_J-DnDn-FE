<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Droplets,
  Factory,
  Gauge,
  Leaf,
  LineChart,
  MapPin,
  Medal,
  Mountain,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Timer,
  TreePine,
  Truck,
  Waves,
  Wind,
  Zap,
} from 'lucide-vue-next'

const filters = ref({
  site: '강남 복합개발 1공구',
  period: '이번 주',
  role: '현장 총책임자',
  trade: '전체',
  risk: '전체',
})

const sites = ['강남 복합개발 1공구', '인천 물류센터 증축', '세종 복합문화공간']
const periods = ['오늘', '이번 주', '이번 달', '사용자 지정']
const roles = ['현장 총책임자', '공정 책임자', '본사 관리자', '일반 사용자']
const trades = ['전체', '토공', '골조', '전기', '설비', '마감']
const risks = ['전체', '정상', '주의', '위험', '긴급']

const siteSummaries = [
  {
    site: '강남 복합개발 1공구',
    totalTasks: 42,
    normalTasks: 36,
    accidentFreeDays: 128,
    hazardousPlannedTasks: 5,
    equipmentWaitMinutes: 624,
    waitReductionRate: -18,
    fuelSavedLiter: 14.8,
    carbonReductionKg: 38.6,
    washExpectedKwh: 514,
    washActualKwh: 390,
    washEfficiency: 76,
    dustReduction: 71,
    governanceScore: 86,
  },
  {
    site: '인천 물류센터 증축',
    totalTasks: 35,
    normalTasks: 29,
    accidentFreeDays: 84,
    hazardousPlannedTasks: 7,
    equipmentWaitMinutes: 790,
    waitReductionRate: -9,
    fuelSavedLiter: 9.2,
    carbonReductionKg: 24.1,
    washExpectedKwh: 460,
    washActualKwh: 372,
    washEfficiency: 69,
    dustReduction: 62,
    governanceScore: 79,
  },
  {
    site: '세종 복합문화공간',
    totalTasks: 28,
    normalTasks: 25,
    accidentFreeDays: 211,
    hazardousPlannedTasks: 2,
    equipmentWaitMinutes: 410,
    waitReductionRate: -22,
    fuelSavedLiter: 7.4,
    carbonReductionKg: 19.3,
    washExpectedKwh: 310,
    washActualKwh: 246,
    washEfficiency: 81,
    dustReduction: 84,
    governanceScore: 91,
  },
]

const processRisks = [
  { id: 1, site: '강남 복합개발 1공구', name: '지상 6~15층 골조', trade: '골조', location: '6~15F', planned: 68, actual: 55, delayDays: 7, risk: '위험', cpImpact: true, manager: '오반장' },
  { id: 2, site: '강남 복합개발 1공구', name: '타워크레인 양중 계획', trade: '골조', location: 'B동 코어', planned: 74, actual: 64, delayDays: 4, risk: '주의', cpImpact: true, manager: '김도윤' },
  { id: 3, site: '강남 복합개발 1공구', name: '지하층 배수 배관', trade: '설비', location: 'B2~B1', planned: 48, actual: 39, delayDays: 3, risk: '주의', cpImpact: false, manager: '서기훈' },
  { id: 4, site: '강남 복합개발 1공구', name: '외장 커튼월 선행 검측', trade: '마감', location: '동측 입면', planned: 31, actual: 18, delayDays: 6, risk: '위험', cpImpact: false, manager: '이현수' },
  { id: 5, site: '인천 물류센터 증축', name: '기초 콘크리트 타설', trade: '토공', location: 'C구역', planned: 82, actual: 63, delayDays: 8, risk: '긴급', cpImpact: true, manager: '박지훈' },
  { id: 6, site: '세종 복합문화공간', name: '전기 간선 배관', trade: '전기', location: 'EPS', planned: 58, actual: 54, delayDays: 1, risk: '정상', cpImpact: false, manager: '정민재' },
]

const weatherAlerts = [
  { site: '강남 복합개발 1공구', type: '강풍', time: '04.30 13:00', trade: '골조', action: '타워크레인 양중 작업 시간 조정', status: '주의', icon: Wind },
  { site: '강남 복합개발 1공구', type: '우천', time: '05.01 09:00', trade: '토공', action: '굴착면 배수 계획 재확인', status: '주의', icon: Droplets },
  { site: '강남 복합개발 1공구', type: '미세먼지', time: '05.02 10:00', trade: '마감', action: '살수차 운영 및 민원 모니터링 강화', status: '관찰', icon: CloudSun },
  { site: '인천 물류센터 증축', type: '폭염', time: '05.01 14:00', trade: '골조', action: '콘크리트 타설 시간대 조정', status: '주의', icon: CloudSun },
]

const complaints = [
  { id: 1, site: '강남 복합개발 1공구', date: '2026-04-24', type: '비산먼지', work: '토사 반출', status: '완료', memo: '살수 간격 30분 단축 후 재발 없음', count: 1 },
  { id: 2, site: '강남 복합개발 1공구', date: '2026-04-26', type: '소음', work: '야간 자재 반입', status: '조치 중', memo: '반입 시간을 21시 이전으로 조정', count: 1 },
  { id: 3, site: '강남 복합개발 1공구', date: '2026-04-28', type: '비산먼지', work: '절단 작업', status: '접수', memo: '집진 장비 추가 배치 예정', count: 1 },
  { id: 4, site: '인천 물류센터 증축', date: '2026-04-25', type: '소음', work: '파일 항타', status: '완료', memo: '작업 공지 문자 발송', count: 1 },
]

const ecoActions = [
  { label: '장비 공회전 감소', value: '42분', icon: Truck, tone: 'emerald', desc: '입출차 대기 흐름 개선' },
  { label: '세척 전력 절감', value: '124kWh', icon: Zap, tone: 'lime', desc: '세척 설비 가동 최적화' },
  { label: '비산먼지 대응', value: '71%', icon: Wind, tone: 'sky', desc: '살수/집진 조치 반영' },
]

const missions = [
  { title: '장비 대기시간 20% 줄이기', progress: 82, status: '진행 우수' },
  { title: '세척 전력 절감률 25% 달성', progress: 76, status: '근접' },
  { title: '민원 2건 이하 유지', progress: 58, status: '관리 필요' },
]

const zones = [
  { name: 'A 게이트', icon: Truck, status: '주의', label: '차량 대기 증가', value: '대기 14분' },
  { name: '세척장', icon: Waves, status: '우수', label: '전력 절감 양호', value: '-124kWh' },
  { name: '골조 구역', icon: Factory, status: '위험', label: '강풍 영향 가능', value: '2건' },
  { name: '민원 구역', icon: Bell, status: '관리', label: '소음/먼지 접수', value: '3건' },
]

const updateHistory = [
  { time: '09:20', text: '강풍 알림 반영 · 양중 작업 시간 조정 권고' },
  { time: '08:45', text: '입출차 평균 대기시간 재계산 · 공회전 42분 감소' },
  { time: '18:10', text: '공사일보 기준 골조 진척률 업데이트' },
]

const currentSite = computed(() => siteSummaries.find((item) => item.site === filters.value.site) ?? siteSummaries[0])
const scheduleCompliance = computed(() => Math.round((currentSite.value.normalTasks / currentSite.value.totalTasks) * 1000) / 10)
const visibleWeatherAlerts = computed(() => weatherAlerts.filter((row) => row.site === filters.value.site && (filters.value.trade === '전체' || row.trade === filters.value.trade)))
const visibleComplaints = computed(() => complaints.filter((row) => row.site === filters.value.site))
const complaintCount = computed(() => visibleComplaints.value.reduce((sum, item) => sum + item.count, 0))
const washSavedKwh = computed(() => currentSite.value.washExpectedKwh - currentSite.value.washActualKwh)
const visibleRisks = computed(() => {
  let rows = processRisks.filter((row) => row.site === filters.value.site)
  if (filters.value.role === '공정 책임자') rows = rows.filter((row) => row.trade === '골조')
  if (filters.value.role === '일반 사용자') rows = rows.filter((row) => row.cpImpact)
  if (filters.value.trade !== '전체') rows = rows.filter((row) => row.trade === filters.value.trade)
  if (filters.value.risk !== '전체') rows = rows.filter((row) => row.risk === filters.value.risk)
  return rows
})
const delayRiskRows = computed(() => visibleRisks.value.filter((row) => ['주의', '위험', '긴급'].includes(row.risk)))

const safetyIndex = computed(() => {
  const weatherPenalty = visibleWeatherAlerts.value.length * 2
  const taskPenalty = currentSite.value.hazardousPlannedTasks
  const accidentBonus = currentSite.value.accidentFreeDays >= 100 ? 4 : 0
  return Math.max(70, Math.min(98, 100 - weatherPenalty - taskPenalty + accidentBonus))
})

const environmentScore = computed(() => Math.round((currentSite.value.washEfficiency * 0.45 + Math.min(currentSite.value.carbonReductionKg * 2, 100) * 0.35 + currentSite.value.dustReduction * 0.2) * 10) / 10)
const socialScore = computed(() => Math.round((safetyIndex.value * 0.65 + Math.max(50, 100 - complaintCount.value * 10) * 0.35) * 10) / 10)
const governanceScore = computed(() => Math.round((scheduleCompliance.value * 0.7 + currentSite.value.governanceScore * 0.3) * 10) / 10)
const esgScore = computed(() => Math.round((environmentScore.value * 0.4 + socialScore.value * 0.3 + governanceScore.value * 0.3) * 10) / 10)

const esgLevel = computed(() => {
  const score = esgScore.value
  if (score >= 90) return { level: 5, name: 'ESG 모범 현장', next: 100, icon: TreePine, gradient: 'from-emerald-500 via-green-400 to-lime-300' }
  if (score >= 75) return { level: 4, name: '우수 운영 현장', next: 90, icon: TreePine, gradient: 'from-emerald-500 via-teal-400 to-sky-300' }
  if (score >= 60) return { level: 3, name: '안정 운영 현장', next: 75, icon: Sprout, gradient: 'from-lime-500 via-emerald-400 to-teal-300' }
  if (score >= 40) return { level: 2, name: '관리 필요 현장', next: 60, icon: Sprout, gradient: 'from-amber-400 via-lime-300 to-emerald-300' }
  return { level: 1, name: '개선 필요 현장', next: 40, icon: Sprout, gradient: 'from-orange-400 via-amber-300 to-lime-300' }
})

const nextLevelGap = computed(() => Math.max(0, Math.round((esgLevel.value.next - esgScore.value) * 10) / 10))
const circleStyle = computed(() => ({ background: `conic-gradient(#10b981 ${esgScore.value * 3.6}deg, rgba(255,255,255,.18) 0deg)` }))

const esgRows = computed(() => [
  { key: 'E', name: 'Environment', label: '탄소 저감 · 전력 절감 · 비산먼지', score: environmentScore.value, icon: Leaf },
  { key: 'S', name: 'Social', label: '무사고 · 민원 대응 · 기상 위험', score: socialScore.value, icon: ShieldCheck },
  { key: 'G', name: 'Governance', label: '공정 투명성 · 권한 기반 조회', score: governanceScore.value, icon: Medal },
])

const mainKpis = computed(() => [
  { label: 'ESG 현장 점수', value: `${esgScore.value}`, unit: '점', sub: `Lv.${esgLevel.value.level} ${esgLevel.value.name}`, icon: Award, tone: 'emerald' },
  { label: '탄소 저감량', value: `${currentSite.value.carbonReductionKg}`, unit: 'kgCO₂e', sub: '공회전/대기시간 개선 추정', icon: Leaf, tone: 'green' },
  { label: '세척 전력 절감', value: `${washSavedKwh.value}`, unit: 'kWh', sub: `효율 ${currentSite.value.washEfficiency}%`, icon: Zap, tone: 'lime' },
  { label: '운영 리스크', value: `${delayRiskRows.value.length + visibleWeatherAlerts.value.length}`, unit: '건', sub: '지연 공정 + 기상 알림', icon: AlertTriangle, tone: 'amber' },
])

const roleNotice = computed(() => {
  if (filters.value.role === '현장 총책임자') return '전체 ESG 지표와 현장 리스크를 모두 조회할 수 있습니다.'
  if (filters.value.role === '공정 책임자') return '담당 공정 중심으로 지연 위험과 기상 영향을 축약해 표시합니다.'
  if (filters.value.role === '본사 관리자') return '여러 현장의 ESG 현황을 조회하며 상세 수정 권한은 제한됩니다.'
  return '일반 사용자는 CP 영향 공정 등 제한된 운영 참고 정보만 조회합니다.'
})

const badgeClass = (status) => ({
  정상: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  우수: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  관리: 'bg-sky-50 text-sky-700 ring-sky-200',
  주의: 'bg-amber-50 text-amber-700 ring-amber-200',
  위험: 'bg-rose-50 text-rose-700 ring-rose-200',
  긴급: 'bg-red-600 text-white ring-red-600',
  관찰: 'bg-sky-50 text-sky-700 ring-sky-200',
  접수: 'bg-slate-100 text-slate-600 ring-slate-200',
  '조치 중': 'bg-amber-50 text-amber-700 ring-amber-200',
  완료: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
})[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'

const kpiClass = (tone) => ({
  emerald: 'from-emerald-50 via-white to-teal-50 text-emerald-700 ring-emerald-100',
  green: 'from-green-50 via-white to-emerald-50 text-green-700 ring-green-100',
  lime: 'from-lime-50 via-white to-emerald-50 text-lime-700 ring-lime-100',
  amber: 'from-amber-50 via-white to-orange-50 text-amber-700 ring-amber-100',
})[tone]
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[#eef8f0] px-5 py-6 text-slate-800">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div class="absolute right-0 top-20 h-[460px] w-[460px] rounded-full bg-lime-200/40 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      <div class="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_1px_1px,rgba(21,128,61,.16)_1px,transparent_0)] [background-size:24px_24px]" />
    </div>

    <section class="relative rounded-[34px] bg-gradient-to-br from-[#063f2f] via-[#0b6b4d] to-[#78b82a] p-6 text-white shadow-2xl shadow-emerald-900/20">
      <div class="absolute inset-0 overflow-hidden rounded-[34px]">
        <div class="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/15" />
        <div class="absolute right-16 top-14 h-32 w-32 rounded-full border border-white/10" />
        <TreePine class="absolute bottom-5 right-10 h-24 w-24 text-white/10" />
        <Leaf class="absolute left-1/2 top-8 h-12 w-12 rotate-12 text-white/10" />
      </div>

      <div class="relative grid gap-8 xl:grid-cols-[1.1fr_.9fr] xl:items-end">
        <div>
          <div class="mb-5 flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-white/15 px-3 py-1 text-xs font-black ring-1 ring-white/20">DnDn ESG Field Level</span>
            <span class="rounded-full bg-emerald-950/25 px-3 py-1 text-xs font-bold text-emerald-50 ring-1 ring-white/10">마지막 업데이트 2026-04-29 09:20</span>
          </div>
          <h1 class="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            공사현장 ESG 대시보드
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">

          </p>
        </div>

        <div class="rounded-3xl bg-white/12 p-4 backdrop-blur-md ring-1 ring-white/20">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label class="space-y-1">
              <span class="text-[11px] font-black text-emerald-50">현장</span>
              <select v-model="filters.site" class="hero-select"><option v-for="site in sites" :key="site">{{ site }}</option></select>
            </label>
            <label class="space-y-1">
              <span class="text-[11px] font-black text-emerald-50">기간</span>
              <select v-model="filters.period" class="hero-select"><option v-for="period in periods" :key="period">{{ period }}</option></select>
            </label>
            <label class="space-y-1">
              <span class="text-[11px] font-black text-emerald-50">권한</span>
              <select v-model="filters.role" class="hero-select"><option v-for="role in roles" :key="role">{{ role }}</option></select>
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="relative -mt-8 grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in mainKpis" :key="card.label" class="rounded-3xl bg-gradient-to-br p-5 shadow-xl shadow-emerald-900/10 ring-1" :class="kpiClass(card.tone)">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black text-slate-500">{{ card.label }}</p>
            <div class="mt-2 flex items-end gap-1">
              <p class="text-3xl font-black tracking-tight text-slate-950">{{ card.value }}</p>
              <p class="mb-1 text-xs font-black text-slate-400">{{ card.unit }}</p>
            </div>
            <p class="mt-1 text-xs font-bold text-slate-500">{{ card.sub }}</p>
          </div>
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </div>
      </article>
    </section>

    <section class="relative mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
      <article class="eco-panel overflow-hidden xl:col-span-5">
        <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-emerald-500/12 via-lime-400/10 to-sky-400/10" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div class="mx-auto grid h-56 w-56 shrink-0 place-items-center rounded-full p-3 shadow-inner" :style="circleStyle">
            <div class="grid h-full w-full place-items-center rounded-full bg-white shadow-xl ring-1 ring-emerald-100">
              <div class="text-center">
                <component :is="esgLevel.icon" class="mx-auto h-10 w-10 text-emerald-600" />
                <p class="mt-2 text-sm font-black text-emerald-700">Lv.{{ esgLevel.level }}</p>
                <p class="text-5xl font-black tracking-tight text-slate-950">{{ esgScore }}</p>
                <p class="text-xs font-black text-slate-400">ESG SCORE</p>
              </div>
            </div>
          </div>

          <div class="flex-1">
            <p class="section-eyebrow">Field Level</p>
            <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-950">{{ esgLevel.name }}</h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              현재 현장은 <b class="text-emerald-700">Lv.{{ esgLevel.level }}</b> 단계입니다.
              다음 Lv.{{ esgLevel.level + 1 }}까지 <b class="text-emerald-700">{{ nextLevelGap }}점</b> 남았습니다.
            </p>

            <div class="mt-5 rounded-3xl bg-emerald-950 p-4 text-white">
              <div class="flex items-center gap-2 text-xs font-black text-emerald-100">
                <Sparkles class="h-4 w-4" /> ESG 개선 포인트
              </div>
              <p class="mt-2 text-sm leading-6 text-emerald-50">
                민원 발생을 1건 줄이고 세척 전력 효율을 5%p 높이면 Lv.5 진입 가능성이 높아집니다.
              </p>
            </div>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-eyebrow">E · S · G</p>
            <h2 class="section-title">ESG 점수 분해</h2>
          </div>
          <Recycle class="h-6 w-6 text-emerald-600" />
        </div>

        <div class="mt-5 space-y-4">
          <div v-for="row in esgRows" :key="row.key" class="rounded-3xl bg-gradient-to-r from-emerald-50 to-white p-4 ring-1 ring-emerald-100/70">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <component :is="row.icon" class="h-5 w-5" />
                </span>
                <div>
                  <p class="text-sm font-black text-slate-900">{{ row.key }} · {{ row.name }}</p>
                  <p class="text-[11px] font-bold text-slate-500">{{ row.label }}</p>
                </div>
              </div>
              <span class="text-xl font-black text-emerald-700">{{ row.score }}</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-emerald-100">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-400" :style="{ width: `${row.score}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-eyebrow">Mission</p>
            <h2 class="section-title">이번 주 ESG 미션</h2>
          </div>
          <Target class="h-6 w-6 text-emerald-600" />
        </div>
        <div class="mt-5 space-y-3">
          <div v-for="mission in missions" :key="mission.title" class="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-black text-slate-900">{{ mission.title }}</p>
              <span class="text-xs font-black text-emerald-700">{{ mission.progress }}%</span>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-400" :style="{ width: `${mission.progress}%` }" />
            </div>
            <p class="mt-2 text-[11px] font-bold text-slate-500">{{ mission.status }}</p>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-eyebrow">Eco Action</p>
            <h2 class="section-title">탄소 수치 행동 변환</h2>
          </div>
          <Leaf class="h-6 w-6 text-emerald-600" />
        </div>
        <div class="mt-5 grid gap-3">
          <div v-for="action in ecoActions" :key="action.label" class="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-white to-emerald-50 p-4 ring-1 ring-emerald-100">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <component :is="action.icon" class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-black text-slate-900">{{ action.label }}</p>
              <p class="text-xs font-bold text-slate-500">{{ action.desc }}</p>
            </div>
            <p class="text-xl font-black text-emerald-700">{{ action.value }}</p>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-5">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="section-eyebrow">Field Map</p>
            <h2 class="section-title">현장 ESG 미니맵</h2>
          </div>
          <RouterLink to="/site/gate" class="small-link">입출차 관리 <ArrowRight class="h-3.5 w-3.5" /></RouterLink>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-for="zone in zones" :key="zone.name" class="rounded-3xl bg-white p-4 ring-1 ring-emerald-100">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef8f0] text-emerald-700">
                  <component :is="zone.icon" class="h-5 w-5" />
                </span>
                <div>
                  <p class="font-black text-slate-900">{{ zone.name }}</p>
                  <p class="text-xs font-bold text-slate-500">{{ zone.label }}</p>
                </div>
              </div>
              <span class="badge" :class="badgeClass(zone.status)">{{ zone.status }}</span>
            </div>
            <p class="mt-4 text-2xl font-black text-emerald-700">{{ zone.value }}</p>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-eyebrow">Authority</p>
            <h2 class="section-title">권한 기준</h2>
          </div>
          <ShieldCheck class="h-6 w-6 text-emerald-600" />
        </div>
        <p class="mt-5 rounded-3xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 ring-1 ring-emerald-100">{{ roleNotice }}</p>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="mini-stat"><CheckCircle2 class="h-4 w-4 text-emerald-600" /><p class="mt-2 text-xs text-slate-500">무사고</p><p class="text-xl font-black">{{ currentSite.accidentFreeDays }}일</p></div>
          <div class="mini-stat"><Gauge class="h-4 w-4 text-amber-600" /><p class="mt-2 text-xs text-slate-500">위험 작업</p><p class="text-xl font-black">{{ currentSite.hazardousPlannedTasks }}건</p></div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-7">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="section-eyebrow">Process Risk</p>
            <h2 class="section-title">지연 위험 공정</h2>
          </div>
          <div class="flex gap-2">
            <select v-model="filters.trade" class="sub-select"><option v-for="trade in trades" :key="trade">{{ trade }}</option></select>
            <select v-model="filters.risk" class="sub-select"><option v-for="risk in risks" :key="risk">{{ risk }}</option></select>
          </div>
        </div>
        <div class="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
          <table class="w-full min-w-[760px] text-left text-xs">
            <thead class="bg-emerald-50 text-[11px] font-black text-emerald-900">
              <tr>
                <th class="px-4 py-3">작업명</th><th class="px-4 py-3">공종/위치</th><th class="px-4 py-3 text-right">진척률</th><th class="px-4 py-3 text-right">예상 지연</th><th class="px-4 py-3 text-center">위험도</th><th class="px-4 py-3 text-center">CP</th><th class="px-4 py-3">담당자</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-emerald-50 bg-white">
              <tr v-for="row in delayRiskRows" :key="row.id" class="hover:bg-emerald-50/40">
                <td class="px-4 py-4 font-black text-slate-900">{{ row.name }}</td>
                <td class="px-4 py-4 text-slate-600">{{ row.trade }} · {{ row.location }}</td>
                <td class="px-4 py-4 text-right"><p class="font-black text-rose-600">{{ row.actual }}%</p><p class="text-[11px] text-slate-400">계획 {{ row.planned }}%</p></td>
                <td class="px-4 py-4 text-right font-black text-amber-700">+{{ row.delayDays }}일</td>
                <td class="px-4 py-4 text-center"><span class="badge" :class="badgeClass(row.risk)">{{ row.risk }}</span></td>
                <td class="px-4 py-4 text-center"><span class="rounded-full px-2 py-1 text-[10px] font-black" :class="row.cpImpact ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'">{{ row.cpImpact ? '영향' : '없음' }}</span></td>
                <td class="px-4 py-4 text-slate-600">{{ row.manager }}</td>
              </tr>
              <tr v-if="delayRiskRows.length === 0"><td colspan="7" class="px-4 py-10 text-center text-sm text-slate-400">선택한 조건에 해당하는 지연 위험 공정이 없습니다.</td></tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="eco-panel xl:col-span-5">
        <div class="flex items-start justify-between gap-4">
          <div><p class="section-eyebrow">Weather & Complaint</p><h2 class="section-title">기상/민원 대응</h2></div>
          <CloudSun class="h-6 w-6 text-emerald-600" />
        </div>
        <div class="mt-5 space-y-3">
          <div v-for="alert in visibleWeatherAlerts" :key="`${alert.type}-${alert.time}`" class="rounded-3xl bg-gradient-to-r from-sky-50 to-white p-4 ring-1 ring-sky-100">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sky-700 ring-1 ring-sky-100"><component :is="alert.icon" class="h-5 w-5" /></span>
                <div><p class="font-black text-slate-900">{{ alert.type }} · {{ alert.time }}</p><p class="text-xs font-bold text-slate-500">{{ alert.trade }} 공정 영향</p></div>
              </div>
              <span class="badge" :class="badgeClass(alert.status)">{{ alert.status }}</span>
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-600">{{ alert.action }}</p>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-4">
        <div class="flex items-start justify-between gap-4"><div><p class="section-eyebrow">Environment</p><h2 class="section-title">환경 지표 상세</h2></div><Mountain class="h-6 w-6 text-emerald-600" /></div>
        <div class="mt-5 grid grid-cols-2 gap-3">
          <div class="mini-stat"><Truck class="h-4 w-4 text-slate-600" /><p class="mt-2 text-xs text-slate-500">장비 대기시간</p><p class="text-xl font-black">{{ currentSite.equipmentWaitMinutes }}분</p></div>
          <div class="mini-stat"><Leaf class="h-4 w-4 text-emerald-600" /><p class="mt-2 text-xs text-slate-500">연료 절감</p><p class="text-xl font-black">{{ currentSite.fuelSavedLiter }}L</p></div>
          <div class="mini-stat"><Zap class="h-4 w-4 text-amber-600" /><p class="mt-2 text-xs text-slate-500">예상 전력</p><p class="text-xl font-black">{{ currentSite.washExpectedKwh }}kWh</p></div>
          <div class="mini-stat bg-emerald-50 ring-emerald-100"><Zap class="h-4 w-4 text-emerald-600" /><p class="mt-2 text-xs text-emerald-700">절감 전력</p><p class="text-xl font-black text-emerald-700">{{ washSavedKwh }}kWh</p></div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-4">
        <div class="flex items-start justify-between gap-4"><div><p class="section-eyebrow">Complaint</p><h2 class="section-title">민원 조치 현황</h2></div><Bell class="h-6 w-6 text-amber-600" /></div>
        <div class="mt-5 space-y-3">
          <div v-for="item in visibleComplaints" :key="item.id" class="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
            <div class="flex items-center justify-between gap-3"><p class="font-black text-slate-900">{{ item.type }}</p><span class="badge" :class="badgeClass(item.status)">{{ item.status }}</span></div>
            <p class="mt-2 text-xs font-bold text-slate-400">{{ item.date }} · {{ item.work }}</p>
            <p class="mt-3 text-sm leading-6 text-slate-600">{{ item.memo }}</p>
          </div>
        </div>
      </article>

      <article class="eco-panel xl:col-span-4">
        <div class="flex items-start justify-between gap-4"><div><p class="section-eyebrow">Log</p><h2 class="section-title">최근 업데이트</h2></div><Timer class="h-6 w-6 text-emerald-600" /></div>
        <div class="mt-5 space-y-3">
          <div v-for="item in updateHistory" :key="item.time" class="flex gap-3 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100">
            <span class="grid h-9 w-12 place-items-center rounded-xl bg-white text-xs font-black text-emerald-700 ring-1 ring-emerald-100">{{ item.time }}</span>
            <p class="text-sm leading-6 text-slate-600">{{ item.text }}</p>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.hero-select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.94);
  padding: 11px 12px;
  font-size: 12px;
  font-weight: 900;
  color: #0f172a;
  outline: none;
}

.sub-select {
  min-width: 96px;
  border-radius: 14px;
  border: 1px solid #bbf7d0;
  background: white;
  padding: 9px 10px;
  font-size: 12px;
  font-weight: 900;
  color: #14532d;
  outline: none;
}

.eco-panel {
  position: relative;
  border-radius: 28px;
  border: 1px solid rgb(187 247 208 / 0.9);
  background: rgb(255 255 255 / 0.88);
  padding: 22px;
  box-shadow: 0 18px 45px rgb(6 95 70 / 0.10);
  backdrop-filter: blur(18px);
}

.section-eyebrow {
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #059669;
}

.section-title {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 10px;
  font-weight: 950;
  line-height: 1;
  box-shadow: inset 0 0 0 1px currentColor;
}

.small-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 14px;
  background: #047857;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 950;
  color: white;
}

.mini-stat {
  border-radius: 20px;
  background: white;
  padding: 14px;
  box-shadow: inset 0 0 0 1px #bbf7d0;
}
</style>
