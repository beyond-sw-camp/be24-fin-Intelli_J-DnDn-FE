import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const ROLE_SITE_MANAGER = 'site_manager'
export const ACCESS_FULL = 'full'
export const ACCESS_SITE_DASHBOARD_ONLY = 'site_dashboard_only'

const AUTH_STORAGE_KEY = 'dndnAuth'

function readSavedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function saveAuth({ role, isAuthenticated, stayOnLogin, accessScope, isUpload }) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      role,
      isAuthenticated,
      stayOnLogin,
      accessScope,
      isUpload,
    }),
  )
}

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
  const savedAuth = readSavedAuth()

  const role = ref(savedAuth?.role || ROLE_SITE_MANAGER)
  const isAuthenticated = ref(Boolean(savedAuth?.isAuthenticated))
  const stayOnLogin = ref(Boolean(savedAuth?.stayOnLogin))
  const accessScope = ref(savedAuth?.accessScope || ACCESS_FULL)
  const isUpload = ref(savedAuth?.isUpload ?? true)

  const roleLabel = computed(() => '총괄책임자')

  function persistAuth() {
    saveAuth({
      role: role.value,
      isAuthenticated: isAuthenticated.value,
      stayOnLogin: stayOnLogin.value,
      accessScope: accessScope.value,
      isUpload: isUpload.value,
    })
  }

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
      isUpload.value = true
      persistAuth()
      return true
    }
    if (id === 'viewer' && pw === 'viewer') {
      stayOnLogin.value = true
      accessScope.value = ACCESS_SITE_DASHBOARD_ONLY
      role.value = ROLE_SITE_MANAGER
      isAuthenticated.value = true
      isUpload.value = true
      persistAuth()
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
    stayOnLogin.value = false
    accessScope.value = ACCESS_FULL
    isUpload.value = true
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return {
    role,
    roleLabel,
    isAuthenticated,
    stayOnLogin,
    accessScope,
    isUpload,
    login,
    logout,
  }
})
