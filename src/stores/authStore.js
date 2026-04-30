import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const ROLE_SITE_MANAGER = 'site_manager'
export const ACCESS_FULL = 'full'
export const ACCESS_SITE_DASHBOARD_ONLY = 'site_dashboard_only'

/** @param {string} role */
/** @param {string} fullPath */
export function pathAllowedForRole(role, fullPath, accessScope = ACCESS_FULL) {
  const path = fullPath.split('?')[0] || '/'
  if (role !== ROLE_SITE_MANAGER) return false
  if (path === '/') return false
  if (accessScope === ACCESS_SITE_DASHBOARD_ONLY) {
    return path === '/site/dashboard' || path === '/site/schedule'
  }
  if (path.startsWith('/site/')) return true
  if (path.startsWith('/hr/')) return true
  if (path.startsWith('/system/')) return true
  return false
}

export const useAuthStore = defineStore('auth', () => {
  const role = ref(ROLE_SITE_MANAGER)
  const isAuthenticated = ref(false)
  const stayOnLogin = ref(false)
  const accessScope = ref(ACCESS_FULL)

  const roleLabel = computed(() => '총 책임자')

  // 최초 공정표 업로드 여부 추가
  const isUpload = ref(false)
  /**
   * @param {string} userId
   * @param {string} password
   */
  function login(userId, password) {
    const id = (userId || '').trim()
    const pw = (password || '').trim()
    if (id === 'admin' && pw === 'admin') {
      stayOnLogin.value = false
      accessScope.value = ACCESS_FULL
      role.value = ROLE_SITE_MANAGER
      isAuthenticated.value = true
      isUpload.value = false
      return true
    }
    if (id === 'viewer' && pw === 'viewer') {
      stayOnLogin.value = true
      accessScope.value = ACCESS_SITE_DASHBOARD_ONLY
      role.value = ROLE_SITE_MANAGER
      isAuthenticated.value = true
      isUpload.value = true
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
    stayOnLogin.value = false
    accessScope.value = ACCESS_FULL
  }

  return { role, roleLabel, isAuthenticated, stayOnLogin, accessScope, login, logout }
})
