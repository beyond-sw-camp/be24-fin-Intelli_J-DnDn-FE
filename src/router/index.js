import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, pathAllowedForRole } from '../stores/authStore'

const meta = (title) => ({ title })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },

    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: meta('로그인'),
    },
    {
      path: '/site/dashboard',
      name: 'siteDashboard',
      component: () => import('../views/personnel/SiteDashboardView.vue'),
      meta: meta('인사 대시보드'),
    },
    {
      path: '/site/onboarding',
      name: 'siteOnboarding',
      component: () => import('../views/personnel/WorkerOnboardingView.vue'),
      meta: meta('작업자 인력 온보딩'),
    },
    {
      path: '/site/workers/manage',
      name: 'siteWorkerManagement',
      component: () => import('../views/personnel/WorkerManagementView.vue'),
      meta: meta('작업자 관리'),
    },
    {
      path: '/site/workers/manage/:id',
      name: 'siteWorkerProfile',
      component: () => import('../views/personnel/WorkerProfileDetailView.vue'),
      meta: meta('작업자 상세 프로필'),
    },
    {
      path: '/site/onboarding/workers/:id',
      redirect: (to) => ({ path: `/site/workers/manage/${to.params.id}` }),
    },
    {
      path: '/site/workers/:id',
      redirect: (to) => ({ path: `/site/workers/manage/${to.params.id}` }),
    },
    {
      path: '/site/access-attendance',
      redirect: '/site/onboarding',
    },
    {
      path: '/site/work-instructions',
      name: 'siteWorkInstructions',
      component: () => import('../views/schedule/WorkInstructionView.vue'),
      meta: meta('작업 지시'),
    },
    {
      path: '/site/staffing',
      name: 'siteStaffing',
      component: () => import('../views/personnel/StaffingBoardView.vue'),
      meta: meta('인력 배치'),
    },
    {
      path: '/site/man-days',
      name: 'siteManDays',
      component: () => import('../views/personnel/PayrollCalculationView.vue'),
      meta: meta('공수 관리'),
    },
    { path: '/site/settlement', redirect: '/site/dashboard' },
    {
      path: '/site/daily-log',
      name: 'siteDailyLog',
      component: () => import('../views/schedule/DailyWorkReportView.vue'),
      meta: meta('작업 일보'),
    },
    {
      path: '/site/schedule',
      name: 'siteSchedule',
      component: () => import('../views/schedule/ScheduleChartView.vue'),
      meta: meta('공정 지표보고'),
    },
    {
      path: '/site/process-analysis',
      name: 'siteProcessAnalysis',
      component: () => import('../views/schedule/AnalysisView.vue'),
      meta: meta('공정 분석'),
    },
    {
      path: '/site/gate',
      name: 'HeavyEquipmentGate',
      component: () => import('../views/schedule/HeavyEquipmentGateView.vue'),
      meta: meta('중장비 입출차'),
    },
    {
      path: '/site/work-plan',
      name: 'siteWorkPlan',
      component: () => import('../views/schedule/WorkPlanView.vue'),
      meta: meta('작업 계획'),
    },
    {
      path: '/site/weather',
      name: 'siteWeather',
      component: () => import('../views/schedule/WeatherControlView.vue'),
      meta: meta('기상 관제'),
    },
    {
      path: '/site/documents/upload',
      name: 'siteDocumentUpload',
      component: () => import('../views/misc/PlaceholderView.vue'),
      meta: meta('업로드 문서'),
    },
    {
      path: '/site/documents/ai-history',
      name: 'siteDocumentAiHistory',
      component: () => import('../views/misc/PlaceholderView.vue'),
      meta: meta('AI 분석 이력'),
    },
    { path: '/site/alerts', redirect: '/site/dashboard' },

    { path: '/hr/sites', redirect: '/site/dashboard' },
    { path: '/hr/sites/:id', redirect: '/site/dashboard' },
    {
      path: '/hr/partners',
      name: 'hrPartners',
      component: () => import('../views/personnel/PartnerListView.vue'),
      meta: meta('협력사 관리'),
    },
    {
      path: '/hr/partners/:id',
      name: 'hrPartnerDetail',
      component: () => import('../views/personnel/PartnerDetailView.vue'),
      meta: meta('협력사 상세'),
    },
    {
      path: '/hr/attendance/list',
      name: 'hrAttendanceList',
      component: () => import('../views/personnel/AttendanceListView.vue'),
      meta: meta('전체 근태 목록'),
    },
    {
      path: '/hr/attendance/closing',
      name: 'hrAttendanceClosing',
      component: () => import('../views/personnel/AttendanceClosingView.vue'),
      meta: meta('근태 마감'),
    },
    { path: '/hr/payroll/calculation', redirect: '/site/man-days' },
    { path: '/hr/payroll/ledger', redirect: '/site/dashboard' },
    { path: '/hr/payroll/statement', redirect: '/site/dashboard' },
    { path: '/hr/payroll/standard', redirect: '/site/dashboard' },
    {
      path: '/hr/accounts',
      name: 'hrAccounts',
      component: () => import('../views/personnel/AccountListView.vue'),
      meta: meta('계정 관리'),
    },
    {
      path: '/system/admins',
      name: 'systemAdmins',
      component: () => import('../views/system/SystemAdminListView.vue'),
      meta: meta('시스템 관리자'),
    },

    { path: '/SiteManagement', redirect: '/site/dashboard' },
    { path: '/SiteManagement/:id', redirect: '/site/dashboard' },
    { path: '/PartnerManagement', redirect: '/hr/partners' },
    { path: '/PartnerManagement/:id', redirect: (to) => ({ path: `/hr/partners/${to.params.id}` }) },
    { path: '/Attendance/List', redirect: '/site/workers/manage' },
    { path: '/Attendance/Closing', redirect: '/site/dashboard' },
    { path: '/Payroll/Calculation', redirect: '/site/man-days' },
    { path: '/Payroll/Ledger', redirect: '/site/dashboard' },
    { path: '/Payroll/Statement', redirect: '/site/dashboard' },
    { path: '/Payroll/Standard', redirect: '/site/dashboard' },
    { path: '/Account/List', redirect: '/site/dashboard' },
    { path: '/Invoices', redirect: '/site/dashboard' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.path === '/login') {
    if (auth.isAuthenticated) {
      if (auth.stayOnLogin) return true
      return { path: '/site/dashboard' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { path: '/login' }
  }

  if (!pathAllowedForRole(auth.role, to.path, auth.accessScope)) {
    if (auth.stayOnLogin) {
      return { path: '/site/dashboard', query: to.query }
    }
    return { path: '/login' }
  }
  return true
})

export default router
