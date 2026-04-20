import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const ROLE_SITE_MANAGER = 'site_manager'

/** @param {string} role */
/** @param {string} fullPath */
export function pathAllowedForRole(role, fullPath) {
  const path = fullPath.split('?')[0] || '/'
  if (role !== ROLE_SITE_MANAGER) return false
  if (path === '/') return false
  if (path.startsWith('/site/')) return true
  if (path.startsWith('/hr/')) return true
  return false
}

export const useAuthStore = defineStore('auth', () => {
  const role = ref(ROLE_SITE_MANAGER)
  const isAuthenticated = ref(false)

  const roleLabel = computed(() => '총 책임자')

  /**
   * @param {string} userId
   * @param {string} password
   */
  function login(userId, password) {
    const id = (userId || '').trim()
    const pw = (password || '').trim()
    if (id === 'admin' && pw === 'admin') {
      isAuthenticated.value = true
      role.value = ROLE_SITE_MANAGER
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
  }

  return { role, roleLabel, isAuthenticated, login, logout }
})
