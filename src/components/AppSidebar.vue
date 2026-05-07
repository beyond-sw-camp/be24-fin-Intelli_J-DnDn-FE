<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Leaf,
  LayoutDashboard,
  Users,
  ClipboardList,
  MapPin,
  FileText,
  HardHat,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarRange,
  CalendarDays,
  CloudSun,
  Truck,
  Upload,
  Shield,
  UserCog,
  Building2,
  LogOut,
  KeyRound,
} from 'lucide-vue-next'
import { useAuthStore, USER_ROLE } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const userMenuOpen = ref(false)
const userMenuRoot = ref(/** @type {HTMLElement | null} */ (null))

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function onDocPointerDown(e) {
  if (!userMenuOpen.value) return
  const root = userMenuRoot.value
  if (root && e.target instanceof Node && !root.contains(e.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocPointerDown)
  document.addEventListener('touchstart', onDocPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocPointerDown)
  document.removeEventListener('touchstart', onDocPointerDown)
})

function onLogout() {
  auth.logout()
  closeUserMenu()
  router.push('/login')
}

function goChangePassword() {
  closeUserMenu()
  router.push('/account/password')
}

const scheduleOpen = ref(true)
const deploymentOpen = ref(true)
const siteInfoOpen = ref(true)
const documentOpen = ref(true)
const accountMgmtOpen = ref(true)
const sidebarExpanded = ref(true)

watch(sidebarExpanded, (expanded) => {
  userMenuOpen.value = false
  if (expanded) {
    scheduleOpen.value = true
    deploymentOpen.value = true
    siteInfoOpen.value = true
    documentOpen.value = true
    accountMgmtOpen.value = true
  }
})

const L = {
  brandTitle: '인사 관리',
  brandSub: '인사 · 일정 메뉴',
  bannerDefault:
    '총 책임자 권한으로 인사 및 일정 메뉴에서 주요 기능을 이용할 수 있습니다.',
  bannerAdmin: '시스템 관리자 권한으로 계정 및 전체 기능을 이용할 수 있습니다.',
  bannerHeadquarter:
    '본사 권한으로 ESG 대시보드와 전체 공정표를 이용할 수 있습니다.',
  scheduleGroup: '일정 관리',
  deploymentGroup: '투입 관리',
  siteInfoGroup: '현장 정보',
  documentGroup: '문서 관리',
  systemMgmtGroup: '시스템 관리',
  userMenuChangePwd: '비밀번호 수정',
  userMenuLogout: '로그아웃',
  sidebarCollapse: '사이드바 접기',
  sidebarExpand: '사이드바 펼치기',
}

const bannerText = computed(() => {
  if (auth.userRole === USER_ROLE.ADMIN) return L.bannerAdmin
  if (auth.userRole === USER_ROLE.HEADQUARTOR) return L.bannerHeadquarter
  return L.bannerDefault
})

const scheduleNavAll = [
  {
    path: '/site/dashboard',
    label: 'ESG 대시보드',
    icon: Leaf,
  },
  {
    path: '/site/schedule',
    label: '전체 공정표',
    icon: LayoutDashboard,
  },
  {
    path: '/site/work-plan',
    label: '공정 계획',
    icon: ClipboardList,
  },
  {
    path: '/site/work-instructions',
    label: '작업 지시',
    icon: FileText,
  },
  { path: '/site/daily-log', label: '공사 일보', icon: CalendarDays },
  {
    path: '/site/process-analysis',
    label: '공정 분석',
    icon: CalendarRange,
  },
]

const deploymentNavAll = [
  {
    path: '/site/workers/manage',
    label: '근무자 관리',
    icon: Users,
    activePrefix: '/site/workers/manage',
  },
  { path: '/site/staffing', label: '인력 배치', icon: MapPin },
]

const siteInfoNavAll = [
  { path: '/site/weather', label: '기상 관제', icon: CloudSun },
  { path: '/site/gate', label: '장비 입출차', icon: Truck },
]

const documentNavAll = [
  { path: '/site/documents/upload', label: '업로드 문서', icon: Upload },
  { path: '/site/documents/ai-history', label: 'AI 분석 이력', icon: FileText },
]

const accountNavAll = [
  {
    path: '/hr/accounts',
    label: '계정 및 권한 관리',
    icon: UserCog,
  },
  {
    path: '/hr/sites',
    label: '현장 등록',
    icon: Building2,
  },
]

/** 본사(HEADQUARTOR): 일정 그룹에서 대시보드·공정표만 노출 */
const scheduleItemsVisible = computed(() => {
  if (auth.userRole === USER_ROLE.HEADQUARTOR) {
    return scheduleNavAll.filter((i) =>
      ['/site/dashboard', '/site/schedule'].includes(i.path),
    )
  }
  return scheduleNavAll
})

/** 본사: 투입/현장/문서 미노출 */
const deploymentItemsVisible = computed(() =>
  auth.userRole === USER_ROLE.HEADQUARTOR ? [] : deploymentNavAll,
)
const siteInfoItemsVisible = computed(() =>
  auth.userRole === USER_ROLE.HEADQUARTOR ? [] : siteInfoNavAll,
)
const documentItemsVisible = computed(() =>
  auth.userRole === USER_ROLE.HEADQUARTOR ? [] : documentNavAll,
)

const navGroups = computed(() => {
  const groups = [
    {
      key: 'schedule',
      label: L.scheduleGroup,
      icon: CalendarRange,
      items: scheduleItemsVisible.value,
      open: scheduleOpen,
      iconClass: 'bg-gradient-to-br from-forena-500 to-forena-700',
      borderClass: 'border-forena-100',
    },
    {
      key: 'deployment',
      label: L.deploymentGroup,
      icon: Users,
      items: deploymentItemsVisible.value,
      open: deploymentOpen,
      iconClass: 'bg-gradient-to-br from-flare-500 to-flare-600',
      borderClass: 'border-flare-100',
    },
    {
      key: 'site-info',
      label: L.siteInfoGroup,
      icon: HardHat,
      items: siteInfoItemsVisible.value,
      open: siteInfoOpen,
      iconClass: 'bg-gradient-to-br from-forena-500 to-forena-700',
      borderClass: 'border-forena-100',
    },
    {
      key: 'document',
      label: L.documentGroup,
      icon: FileText,
      items: documentItemsVisible.value,
      open: documentOpen,
      iconClass: 'bg-gradient-to-br from-flare-500 to-flare-600',
      borderClass: 'border-flare-100',
    },
  ]

  /** 시스템 관리자(ADMIN)만 시스템 관리 그룹 */
  if (auth.userRole === USER_ROLE.ADMIN) {
    groups.push({
      key: 'account',
      label: L.systemMgmtGroup,
      icon: Shield,
      items: accountNavAll,
      open: accountMgmtOpen,
      iconClass: 'bg-gradient-to-br from-slate-600 to-forena-800',
      borderClass: 'border-slate-200',
    })
  }

  return groups.filter((g) => Array.isArray(g.items) && g.items.length > 0)
})

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
      {{ bannerText }}
    </div>

    <nav
      class="mt-5 min-h-0 min-w-0 flex-1 overflow-y-auto pb-4"
      :class="
        sidebarExpanded ? 'space-y-1' : 'mt-4 flex flex-col items-center gap-0.5'
      "
      :aria-label="sidebarExpanded ? 'Navigation' : 'Navigation compact'"
    >
      <template v-if="sidebarExpanded">
        <div
          v-for="group in navGroups"
          :key="group.key"
          :class="group.key === 'schedule' ? '' : 'mt-4'"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[10px] font-bold tracking-wider text-forena-400 uppercase transition hover:bg-white/60"
            @click="group.open.value = !group.open.value"
          >
            <span class="flex items-center gap-2 text-forena-800">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-md shadow-forena-900/20"
                :class="group.iconClass"
              >
                <component :is="group.icon" class="h-3.5 w-3.5" />
              </span>
              {{ group.label }}
            </span>
            <ChevronDown v-if="group.open.value" class="h-4 w-4 shrink-0 text-flare-500" />
            <ChevronRight v-else class="h-4 w-4 shrink-0 text-slate-400" />
          </button>
          <div
            v-show="group.open.value"
            class="ml-1 space-y-0.5 border-l pl-2"
            :class="group.borderClass"
          >
            <RouterLink
              v-for="item in group.items"
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
        </div>
      </template>
      <template v-else>
        <template v-for="(group, groupIndex) in navGroups" :key="'compact-' + group.key">
          <div v-if="groupIndex > 0" class="my-2 h-px w-8 shrink-0 bg-forena-100" aria-hidden="true" />
          <RouterLink
            v-for="item in group.items"
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
      </template>
    </nav>

    <div ref="userMenuRoot" class="relative shrink-0 border-t border-forena-100/80 pt-2">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gradient-to-r hover:from-forena-50 hover:to-flare-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/60"
        :class="sidebarExpanded ? '' : 'justify-center px-0'"
        :aria-expanded="userMenuOpen"
        aria-haspopup="menu"
        @click.stop="toggleUserMenu"
      >
        <div
          class="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-forena-500 via-flare-400 to-flare-500 shadow-sm ring-1 ring-white"
          :title="auth.roleLabel"
        />
        <div v-show="sidebarExpanded" class="min-w-0 flex-1 leading-tight">
          <p class="truncate text-xs font-semibold text-forena-900">{{ auth.roleLabel }}</p>
          <p class="truncate text-[11px] text-forena-500">
            {{ auth.loginId || '—' }}
          </p>
        </div>
      </button>

      <div
        v-show="userMenuOpen"
        class="absolute top-1/2 left-full z-[80] ml-2 min-w-[11rem] -translate-y-1/2 overflow-hidden rounded-xl border border-forena-200/90 bg-white/95 py-1 shadow-[0_12px_40px_rgba(0,26,61,0.14)] backdrop-blur-sm"
        role="menu"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-forena-800 transition hover:bg-forena-50"
          role="menuitem"
          @click="goChangePassword"
        >
          <KeyRound class="h-3.5 w-3.5 shrink-0 text-forena-500" />
          {{ L.userMenuChangePwd }}
        </button>
        <div class="mx-2 h-px bg-forena-100" role="separator" />
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          role="menuitem"
          @click="onLogout"
        >
          <LogOut class="h-3.5 w-3.5 shrink-0" />
          {{ L.userMenuLogout }}
        </button>
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
