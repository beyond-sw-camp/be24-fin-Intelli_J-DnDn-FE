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
      component: () => import('../views/system/LoginView.vue'),
      meta: meta('로그인'),
    },
    {
      path: '/account/password',
      name: 'accountPassword',
      component: () => import('../views/system/AccountPasswordView.vue'),
      meta: meta('비밀번호 변경'),
    },
    {
      path: '/site/upload',
      name: 'siteUpload',
      component: () => import('../views/document/FirstDocumentUpload.vue'),
      meta: meta('최초 공정표 문서 등록'),
    },
    { path: '/site/onboarding', redirect: '/site/workers/manage' },
    {
      path: '/site/workers/manage',
      name: 'siteWorkerManagement',
      component: () => import('../views/deployment/WorkerManagementView.vue'),
      meta: meta('근무자 관리'),
    },
    {
      path: '/site/workers/manage/:id',
      name: 'siteWorkerProfile',
      component: () => import('../views/deployment/WorkerProfileDetailView.vue'),
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
      redirect: '/site/workers/manage',
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
      component: () => import('../views/deployment/StaffingBoardView.vue'),
      meta: meta('인력 배치'),
    },
    { path: '/site/man-days', redirect: '/site/dashboard' },
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
      component: () => import('../views/siteInfo/HeavyEquipmentGateView.vue'),
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
      component: () => import('../views/siteInfo/WeatherControlView.vue'),
      meta: meta('기상 관제'),
    },
    {
      path: '/site/dashboard',
      name: 'siteDashboard',
      component: () => import('../views/schedule/EsgDashboardView.vue'),
      meta: meta('ESG 통합 대시보드'),
    },
    {
      path: '/site/documents/upload',
      name: 'siteDocumentUpload',
      component: () => import('../views/document/DocumentUploadView.vue'),
      meta: meta('업로드 문서'),
    },
    { path: '/site/documents/ai-history', redirect: '/site/documents/upload' },
    { path: '/site/alerts', redirect: '/site/dashboard' },

    {
      path: '/hr/sites/:id?',
      redirect: '/hr/accounts',
    },
    { path: '/hr/partners', redirect: '/hr/accounts' },
    { path: '/hr/partners/:id', redirect: '/hr/accounts' },
    { path: '/hr/attendance/list', redirect: '/site/workers/manage' },
    { path: '/hr/attendance/closing', redirect: '/site/dashboard' },
    { path: '/hr/payroll/calculation', redirect: '/site/dashboard' },
    { path: '/hr/payroll/ledger', redirect: '/site/dashboard' },
    { path: '/hr/payroll/statement', redirect: '/site/dashboard' },
    { path: '/hr/payroll/standard', redirect: '/site/dashboard' },
    {
      path: '/hr/accounts',
      name: 'hrAccounts',
      component: () => import('../views/system/SiteRegisterView.vue'),
      meta: meta('계정 및 권한 관리'),
    },
    {
      path: '/hr/accounts/sites/:projectIdx',
      name: 'hrAccountsSite',
      component: () => import('../views/system/AccountListView.vue'),
      meta: meta('계정 및 권한 관리'),
    },
    { path: '/system/admins', redirect: '/hr/accounts' },

    { path: '/SiteManagement', redirect: '/site/dashboard' },
    { path: '/SiteManagement/:id', redirect: '/site/dashboard' },
    { path: '/PartnerManagement', redirect: '/hr/accounts' },
    {
      path: '/PartnerManagement/:id',
      redirect: '/hr/accounts',
    },
    { path: '/Attendance/List', redirect: '/site/workers/manage' },
    { path: '/Attendance/Closing', redirect: '/site/dashboard' },
    { path: '/Payroll/Calculation', redirect: '/site/dashboard' },
    { path: '/Payroll/Ledger', redirect: '/site/dashboard' },
    { path: '/Payroll/Statement', redirect: '/site/dashboard' },
    { path: '/Payroll/Standard', redirect: '/site/dashboard' },
    { path: '/Account/List', redirect: '/hr/accounts' },
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

  if (!pathAllowedForRole(auth.userRole, to.path)) {
    return { path: '/site/dashboard' }
  }
  return true
})

export default router
