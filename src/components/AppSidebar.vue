<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardList,
  MapPin,
  Calculator,
  FileText,
  HardHat,
  Handshake,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarRange,
  CalendarDays,
  CloudSun,
  Truck,
  Upload,
  ShieldCheck,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const auth = useAuthStore()

const personnelOpen = ref(true)
const scheduleOpen = ref(true)
const sidebarExpanded = ref(true)

watch(sidebarExpanded, (expanded) => {
  if (expanded) {
    personnelOpen.value = true
    scheduleOpen.value = true
  }
})

const L = {
  brandTitle: '인사 관리',
  brandSub: '인사 · 일정 메뉴',
  banner: '총 책임자 권한으로 인사 및 일정 메뉴에서 주요 기능을 이용할 수 있습니다.',
  personnelGroup: '인사 관리',
  scheduleGroup: '일정 관리',
  sidebarCollapse: '사이드바 접기',
  sidebarExpand: '사이드바 펼치기',
}

const personnelNavAll = [
  {
    path: '/site/dashboard',
    label: '인사 대시보드',
    icon: LayoutDashboard,
  },
  {
    path: '/site/onboarding',
    label: '작업자 인력 온보딩',
    icon: UserPlus,
  },
  {
    path: '/site/workers/manage',
    label: '작업자 관리',
    icon: Users,
    activePrefix: '/site/workers/manage',
  },
  { path: '/site/staffing', label: '인력 배치', icon: MapPin },
  { path: '/site/man-days', label: '공수 관리', icon: Calculator },
  { path: '/hr/partners', label: '협력사 관리', icon: Handshake },
  { path: '/system/admins', label: '시스템 관리자', icon: ShieldCheck },
]

const scheduleNavAll = [
  {
    path: '/site/schedule',
    label: '공정 지표보고',
    icon: CalendarDays,
  },
  {
    path: '/site/gate',
    label: '중장비 입출차',
    icon: Truck,
  },
  {
    path: '/site/work-plan',
    label: '작업 계획',
    icon: Upload,
  },
  {
    path: '/site/work-instructions',
    label: '작업 지시',
    icon: ClipboardList,
  },
  { path: '/site/daily-log', label: '작업 일보', icon: FileText },
  {
    path: '/site/weather',
    label: '기상 관제',
    icon: CloudSun,
  },
]

function pathActive(path, exact) {
  if (path === '/') return route.path === '/'
  if (exact) return route.path === path
  return route.path === path || route.path.startsWith(`${path}/`)
}

function navItemActive(item) {
  if (item.activePrefix && route.path.startsWith(item.activePrefix)) return true
  return pathActive(item.path, item.exact)
}

function linkClass(item) {
  const active = navItemActive(item)
  return [
    'relative flex items-center gap-2 rounded-xl py-2.5 pl-3 pr-3 text-sm font-medium transition-all duration-200',
    active
      ? [
          'font-semibold text-forena-900 shadow-sm ring-1 ring-forena-200/50',
          'bg-gradient-to-r from-forena-500/[0.12] via-flare-500/[0.06] to-transparent',
          'before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:z-10 before:w-[3px] before:rounded-full',
          'before:bg-gradient-to-r before:from-flare-500 before:via-flare-400/25 before:to-transparent',
        ].join(' ')
      : 'text-slate-600 hover:bg-white/90 hover:text-forena-800 hover:shadow-sm hover:ring-1 hover:ring-forena-100/80',
  ]
}

function linkClassCollapsed(item) {
  const active = navItemActive(item)
  return [
    'relative flex w-full items-center justify-center rounded-xl p-2.5 transition-all duration-200',
    active
      ? 'bg-gradient-to-br from-forena-500/[0.14] to-flare-500/[0.08] text-forena-900 shadow-sm ring-1 ring-forena-200/50'
      : 'text-slate-600 hover:bg-white/90 hover:text-forena-800 hover:ring-1 hover:ring-forena-100/80',
  ]
}
</script>

<template>
  <aside
    class="scrollbar-hide hidden h-full min-h-0 shrink-0 flex-col border-r border-forena-200/50 bg-white/80 py-5 shadow-[4px_0_24px_rgba(0,46,85,0.06)] backdrop-blur-xl transition-[width] duration-300 ease-out md:flex"
    :class="sidebarExpanded ? 'w-72 px-3' : 'w-[4.5rem] px-1.5'"
  >
    <div
      class="flex shrink-0 items-start gap-2"
      :class="sidebarExpanded ? 'flex-row' : 'flex-col items-center gap-3'"
    >
      <RouterLink
        to="/site/dashboard"
        class="group flex min-w-0 flex-1 rounded-2xl py-1 transition hover:bg-forena-50/80"
        :class="sidebarExpanded ? 'items-center gap-3 px-2' : 'w-full justify-center px-0'"
      >
        <div
          class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forena-500 via-forena-600 to-forena-800 text-sm font-bold text-white shadow-lg shadow-forena-900/25 ring-2 ring-flare-400/35 ring-offset-2 ring-offset-white transition group-hover:ring-flare-400/55"
        >
          HQ
        </div>
        <div v-show="sidebarExpanded" class="min-w-0">
          <p class="text-base font-bold tracking-tight text-forena-900">{{ L.brandTitle }}</p>
          <p class="text-[11px] font-medium text-forena-500/90">{{ L.brandSub }}</p>
        </div>
      </RouterLink>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-forena-200/80 bg-white/90 text-forena-600 shadow-sm transition hover:border-flare-300 hover:bg-flare-50/50 hover:text-forena-900"
        :class="sidebarExpanded ? '' : 'mx-auto'"
        :aria-expanded="sidebarExpanded"
        :aria-label="sidebarExpanded ? L.sidebarCollapse : L.sidebarExpand"
        @click="sidebarExpanded = !sidebarExpanded"
      >
        <ChevronsLeft v-if="sidebarExpanded" class="h-4 w-4" />
        <ChevronsRight v-else class="h-4 w-4" />
      </button>
    </div>

    <div
      v-show="sidebarExpanded"
      class="mx-2 mt-4 rounded-2xl border border-flare-200/60 bg-gradient-to-br from-flare-50/90 via-white to-amber-50/40 px-3 py-2.5 text-[11px] leading-snug text-forena-900 shadow-sm"
    >
      {{ L.banner }}
    </div>

    <nav
      class="mt-5 min-h-0 min-w-0 flex-1 overflow-y-auto pb-4"
      :class="sidebarExpanded ? 'space-y-1' : 'mt-4 flex flex-col items-center gap-0.5'"
      :aria-label="sidebarExpanded ? 'Navigation' : 'Navigation compact'"
    >
      <template v-if="sidebarExpanded">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[10px] font-bold tracking-wider text-forena-400 uppercase transition hover:bg-white/60"
          @click="personnelOpen = !personnelOpen"
        >
          <span class="flex items-center gap-2 text-forena-800">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-flare-500 to-flare-600 text-white shadow-md shadow-forena-900/20"
            >
              <HardHat class="h-3.5 w-3.5" />
            </span>
            {{ L.personnelGroup }}
          </span>
          <ChevronDown v-if="personnelOpen" class="h-4 w-4 shrink-0 text-flare-500" />
          <ChevronRight v-else class="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <div v-show="personnelOpen" class="ml-1 space-y-0.5 border-l border-flare-100 pl-2">
          <RouterLink
            v-for="item in personnelNavAll"
            :key="item.path + (item.exact ? ':exact' : '')"
            :to="item.path"
            class="group"
            :class="linkClass(item)"
          >
            <component
              :is="item.icon"
              class="h-4 w-4 shrink-0"
              :class="navItemActive(item) ? 'text-flare-600' : 'text-slate-400'"
            />
            {{ item.label }}
          </RouterLink>
        </div>

        <button
          type="button"
          class="mt-4 flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[10px] font-bold tracking-wider text-forena-400 uppercase transition hover:bg-white/60"
          @click="scheduleOpen = !scheduleOpen"
        >
          <span class="flex items-center gap-2 text-forena-800">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-forena-500 to-forena-700 text-white shadow-md shadow-forena-900/20"
            >
              <CalendarRange class="h-3.5 w-3.5" />
            </span>
            {{ L.scheduleGroup }}
          </span>
          <ChevronDown v-if="scheduleOpen" class="h-4 w-4 shrink-0 text-flare-500" />
          <ChevronRight v-else class="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <div v-show="scheduleOpen" class="ml-1 space-y-0.5 border-l border-forena-100 pl-2">
          <RouterLink
            v-for="item in scheduleNavAll"
            :key="item.path + (item.exact ? ':exact' : '')"
            :to="item.path"
            class="group"
            :class="linkClass(item)"
          >
            <component
              :is="item.icon"
              class="h-4 w-4 shrink-0"
              :class="navItemActive(item) ? 'text-flare-600' : 'text-slate-400'"
            />
            {{ item.label }}
          </RouterLink>
        </div>
      </template>
      <template v-else>
        <RouterLink
          v-for="item in personnelNavAll"
          :key="'c-' + item.path + (item.exact ? ':exact' : '')"
          :to="item.path"
          :title="item.label"
          :class="linkClassCollapsed(item)"
        >
          <component
            :is="item.icon"
            class="h-4 w-4 shrink-0"
            :class="navItemActive(item) ? 'text-flare-600' : 'text-slate-400'"
          />
        </RouterLink>
        <div class="my-2 h-px w-8 shrink-0 bg-forena-100" aria-hidden="true" />
        <RouterLink
          v-for="item in scheduleNavAll"
          :key="'c-' + item.path + (item.exact ? ':exact' : '')"
          :to="item.path"
          :title="item.label"
          :class="linkClassCollapsed(item)"
        >
          <component
            :is="item.icon"
            class="h-4 w-4 shrink-0"
            :class="navItemActive(item) ? 'text-flare-600' : 'text-slate-400'"
          />
        </RouterLink>
      </template>
    </nav>

    <div class="border-t border-forena-100/80 pt-2">
      <div
        class="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-gradient-to-r hover:from-forena-50 hover:to-flare-50/50"
        :class="sidebarExpanded ? '' : 'justify-center px-0'"
      >
        <div
          class="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-forena-500 via-flare-400 to-flare-500 shadow-sm ring-1 ring-white"
          :title="auth.roleLabel"
        />
        <div v-show="sidebarExpanded" class="min-w-0 flex-1 leading-tight">
          <p class="truncate text-xs font-semibold text-forena-900">{{ auth.roleLabel }}</p>
          <p class="truncate text-[11px] text-forena-500">hq@local</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
