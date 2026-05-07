<template>
  <div class="login-page" :style="{ backgroundImage: pageBackground }">
    <div class="login-shell">
      <!-- ── 왼쪽: 브랜드 비주얼 ── -->
      <section class="visual-panel">
        <div class="visual-overlay" />

        <div class="visual-content">
          <!-- 상단 로고 워드마크 -->
          <div class="brand-mark">
            <span class="brand-hq">HQ</span>
            <div class="brand-text">
              <span class="brand-name">DnDn</span>
              <span class="brand-sub">현장 운영 시스템</span>
            </div>
          </div>

          <!-- 지표 카드 그리드 -->
          <div class="metric-grid">
            <div class="metric-card" v-for="m in metrics" :key="m.label">
              <div class="metric-icon" :style="{ background: m.color }">
                <component :is="m.icon" :size="16" />
              </div>
              <div>
                <div class="metric-val">{{ m.val }}</div>
                <div class="metric-label">{{ m.label }}</div>
              </div>
            </div>
          </div>

          <div class="site-dashboard-toggle" aria-label="현장별 대시보드 선택">
            <div class="site-toggle-head">
              <div>
                <p class="site-toggle-kicker">현장별 대시보드</p>
                <h2>현장을 선택하세요</h2>
              </div>
              <span class="access-badge" :class="{ unlocked: authStore.isAuthenticated }">
                <LockKeyhole v-if="!authStore.isAuthenticated" :size="13" />
                {{ authStore.isAuthenticated ? '로그인 완료' : '로그인 필요' }}
              </span>
            </div>

            <div class="site-toggle-list">
              <button
                v-for="site in dashboardSites"
                :key="site.id"
                type="button"
                class="site-toggle-button"
                :class="{ active: selectedSiteId === site.id }"
                @click="selectedSiteId = site.id"
              >
                <span class="site-dot" />
                <span>
                  <strong>{{ site.name }}</strong>
                  <small>{{ site.summary }}</small>
                </span>
              </button>
            </div>

            <div class="locked-preview" :class="{ unlocked: authStore.isAuthenticated }">
              <LockKeyhole v-if="!authStore.isAuthenticated" :size="18" />
              <span v-if="!authStore.isAuthenticated">
                {{ selectedSite.name }} 대시보드는 로그인 후 확인할 수 있습니다.
              </span>
              <div v-else class="site-access-actions">
                <button type="button" class="site-access-button primary" @click="goToSiteDashboard">
                  인사 대시보드 접속
                </button>
                <button type="button" class="site-access-button" @click="goToSiteSchedule">
                  공정 지표보고
                </button>
              </div>
            </div>
          </div>

          <!-- 기능 태그 -->
          <div class="feature-tags">
            <span class="tag" v-for="t in tags" :key="t">{{ t }}</span>
          </div>
        </div>
      </section>

      <!-- ── 오른쪽: 로그인 폼 ── -->
      <section class="form-panel">
        <div class="form-wrap">
          <header class="form-header">
            <img :src="leftLogoSrc" alt="DnDn" class="form-logo" />
          </header>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="field-group">
              <label for="userId">아이디</label>
              <input
                id="userId"
                v-model="form.userId"
                type="text"
                autocomplete="username"
                placeholder="아이디를 입력하세요"
              />
            </div>

            <div class="field-group">
              <label for="password">비밀번호</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div class="meta-row">
              <label class="remember-label">
                <input type="checkbox" v-model="rememberMe" />
                로그인 상태 유지
              </label>
              <button type="button" class="text-action" @click="clearAccount">초기화</button>
            </div>

            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

            <button type="submit" class="primary-action">로그인</button>
          </form>

          <div class="divider" />

          <p class="demo-hint">데모 계정: admin / admin · 화면 유지: viewer / viewer</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Users, MapPin, BarChart3, CloudSun, LockKeyhole } from 'lucide-vue-next'
import bgImage from '@/assets/hanwha-bg.png'
import leftLogoSrc from '@/assets/dndn-logo.png'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ userId: 'admin', password: 'admin' })
const errorMessage = ref('')
const successMessage = ref('')
const rememberMe = ref(false)
const selectedSiteId = ref('forena')

const metrics = [
  {
    icon: Users,
    val: '1224명',
    label: '전체 현장 투입 인원',
    color: 'linear-gradient(135deg,#14b8a6,#0d9488)',
  },
  {
    icon: MapPin,
    val: '6개소',
    label: '운영 현장',
    color: 'linear-gradient(135deg,#002e55,#001c3a)',
  },
]

const dashboardSites = [
  { id: 'forena', name: '강남구 현장', summary: '진척률 · 62%' },
  { id: 'east', name: '신대방동 현장', summary: '진척률 · 48%' },
  { id: 'west', name: '서측 부대시설', summary: '진척률 · 74%' },
  { id: 'mapo', name: '마포구 현장', summary: '진척률 · 57%' },
  { id: 'songpa', name: '송파구 현장', summary: '진척률 · 69%' },
  { id: 'guro', name: '구로구 현장', summary: '진척률 · 41%' },
]

const selectedSite = computed(
  () => dashboardSites.find((site) => site.id === selectedSiteId.value) ?? dashboardSites[0],
)

const pageBackground = computed(
  () =>
    `url(${bgImage})`,
)

watch(
  () => authStore.isAuthenticated,
  (v) => {
    if (v && !authStore.stayOnLogin) {
      const path = authStore.isUpload ? '/site/dashboard' : '/site/upload'
      router.push({ path, query: { site: selectedSiteId.value } })
    }
  },
  { immediate: true },
)

const clearAccount = () => {
  form.userId = ''
  form.password = ''
  errorMessage.value = ''
  successMessage.value = ''
}

const selectedSiteQuery = () => ({ site: selectedSiteId.value })

const goToSiteDashboard = () => {
  router.push({ path: '/site/dashboard', query: selectedSiteQuery() })
}

const goToSiteSchedule = () => {
  router.push({ path: '/site/schedule', query: selectedSiteQuery() })
}

const handleLogin = () => {
  if (authStore.login(form.userId.trim(), form.password.trim())) {
    errorMessage.value = ''
    if (!authStore.stayOnLogin) {
      const path = authStore.isUpload ? '/site/dashboard' : '/site/upload'
      router.push({ path, query: { site: selectedSiteId.value } })
    } else {
      successMessage.value = 'viewer 계정으로 로그인되었습니다. 현재 화면을 유지합니다.'
    }
  } else {
    successMessage.value = ''
    errorMessage.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
  }
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}
button,
input {
  font: inherit;
}

.login-page {
  position: relative;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.login-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(105deg, rgba(0, 20, 40, 0.7) 0%, rgba(0, 30, 58, 0.52) 48%, rgba(0, 20, 40, 0.34) 100%),
    radial-gradient(ellipse 70% 60% at 8% 18%, rgba(20, 184, 166, 0.1) 0%, transparent 54%);
  pointer-events: none;
}

.login-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr minmax(440px, 42%);
}

/* ── Visual Panel ── */
.visual-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 44px 52px 36px;
  overflow: hidden;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.visual-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

/* Brand mark */
.brand-mark {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand-hq {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  background: linear-gradient(135deg, #002e55, #001c3a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 6px 18px rgba(0, 46, 85, 0.35);
  outline: 2px solid rgba(45, 212, 191, 0.4);
  outline-offset: 2px;
  flex-shrink: 0;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1;
}
.brand-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
  margin-top: 2px;
}

/* Hero copy */
.hero-title {
  font-size: 38px;
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  text-wrap: pretty;
}
.hero-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.75;
  margin: 0;
}

/* Metric grid */
.metric-grid {
  width: min(100%, 640px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 34px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
}
.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
}
.metric-val {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.metric-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 3px;
}

.site-dashboard-toggle {
  width: min(100%, 640px);
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
}
.site-toggle-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.site-toggle-kicker {
  margin: 0 0 4px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  font-weight: 800;
}
.site-toggle-head h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  line-height: 1.25;
}
.access-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(0, 28, 58, 0.58);
  color: rgba(255, 255, 255, 0.88);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.access-badge.unlocked {
  background: rgba(20, 184, 166, 0.22);
  color: #d9fffb;
}
.site-toggle-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.site-toggle-button {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 64px;
  padding: 11px 12px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.78);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s,
    border-color 0.16s,
    transform 0.16s;
}
.site-toggle-button:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.42);
}
.site-toggle-button.active {
  background: rgba(0, 46, 85, 0.62);
  border-color: rgba(45, 212, 191, 0.56);
  color: #fff;
}
.site-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #94a3b8;
  flex-shrink: 0;
}
.site-toggle-button.active .site-dot {
  background: #2dd4bf;
  box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.14);
}
.site-toggle-button strong,
.site-toggle-button small {
  display: block;
}
.site-toggle-button strong {
  font-size: 13px;
  line-height: 1.25;
}
.site-toggle-button small {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
}
.locked-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.16);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 600;
}
.locked-preview.unlocked {
  background: rgba(20, 184, 166, 0.16);
  color: #e6fffb;
}
.site-access-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}
.site-access-button {
  min-height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.16s,
    border-color 0.16s,
    transform 0.16s;
}
.site-access-button:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.58);
}
.site-access-button.primary {
  background: #002e55;
  border-color: rgba(45, 212, 191, 0.38);
  color: #fff;
}

/* Feature tags */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(6px);
}

/* Footer */
.visual-footer {
  position: relative;
  z-index: 1;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
  letter-spacing: 0.04em;
}

/* ── Form Panel ── */
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: transparent;
}

.form-wrap {
  width: 100%;
  max-width: 400px;
  padding: 36px 32px;
  border-radius: 24px;
  background: rgba(245, 247, 250, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 28px 64px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(20px);
}

.form-header {
  margin-bottom: 28px;
}
.form-logo {
  display: block;
  height: 60px;
  object-fit: contain;
  margin-bottom: 10px;
  transform: translateX(-3px);
}
.form-tagline {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Fields */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
}
.field-group label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}
.field-group input {
  height: 50px;
  padding: 0 15px;
  border: 1px solid #d1d9e6;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  outline: none;
  font-size: 14px;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
}
.field-group input::placeholder {
  color: #a0aec0;
}
.field-group input:focus {
  border-color: #002e55;
  box-shadow: 0 0 0 3px rgba(0, 46, 85, 0.1);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.remember-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}
.text-action {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.error-message {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
}
.success-message {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
  font-size: 12px;
  font-weight: 700;
}

.primary-action {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #002e55, #001c3a);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 28px rgba(0, 46, 85, 0.3);
  transition:
    transform 0.16s,
    box-shadow 0.16s;
}
.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 32px rgba(0, 46, 85, 0.38);
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 22px 0 18px;
}

.bottom-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.outline-action {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #d1d9e6;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.outline-action:hover {
  border-color: #002e55;
  color: #002e55;
}

.demo-hint {
  margin: 14px 0 0;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .login-shell {
    grid-template-columns: 1fr;
  }
  .visual-panel {
    min-height: 380px;
    padding: 36px 32px 28px;
  }
  .hero-title {
    font-size: 28px;
  }
  .metric-grid {
    grid-template-columns: repeat(4, 1fr);
    margin-top: 0;
  }
  .metric-card {
    padding: 10px 12px;
  }
  .site-dashboard-toggle {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .metric-grid {
    grid-template-columns: 1fr 1fr;
  }
  .hero-title {
    font-size: 24px;
  }
  .form-panel {
    padding: 32px 20px 44px;
  }
  .form-wrap {
    padding: 28px 22px;
  }
  .form-logo {
    height: 100px;
    transform: translateX(-4px);
  }
  .site-toggle-head {
    flex-direction: column;
    gap: 10px;
  }
  .site-toggle-list {
    grid-template-columns: 1fr;
  }
  .site-access-actions {
    grid-template-columns: 1fr;
  }
}
</style>
