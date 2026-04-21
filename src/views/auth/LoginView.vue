<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="visual-panel">
        <div class="visual-overlay"></div>
      </section>

      <section class="form-panel">
        <div class="form-wrap">
          <header class="form-header">
            <img :src="leftLogoSrc" alt="DnDn logo" class="form-logo" />
            <p class="helper-text">Demo account: admin / admin</p>
          </header>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="field-group">
              <label for="userId">ID</label>
              <input
                id="userId"
                v-model="form.userId"
                type="text"
                autocomplete="username"
                placeholder="Enter your ID"
              />
            </div>

            <div class="field-group">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <div class="meta-row">
              <button type="button" class="text-action" @click="clearAccount">Clear</button>
            </div>

            <div class="action-row">
              <button type="submit" class="primary-action">
                Login <span aria-hidden="true">&gt;</span>
              </button>
            </div>
          </form>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import bgImage from '@/assets/hanwha-bg.png'
import leftLogoSrc from '@/assets/dndn-logo.png'

const DEFAULT_USER_ID = 'admin'
const DEFAULT_PASSWORD = 'admin'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  userId: DEFAULT_USER_ID,
  password: DEFAULT_PASSWORD,
})

const errorMessage = ref('')

const pageBackground = computed(
  () =>
    `linear-gradient(90deg, rgba(12, 24, 36, 0.5) 0%, rgba(31, 45, 58, 0.36) 46%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(180deg, rgba(15, 23, 42, 0.14) 0%, rgba(15, 23, 42, 0.26) 100%), url(${bgImage})`,
)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      router.push('/site/dashboard')
    }
  },
  { immediate: true },
)

const clearAccount = () => {
  form.userId = ''
  form.password = ''
  errorMessage.value = ''
}

const handleLogin = () => {
  const userId = form.userId.trim()
  const password = form.password.trim()
  if (authStore.login(userId, password)) {
    errorMessage.value = ''
    router.push('/site/dashboard')
    return
  }
  errorMessage.value = 'Invalid account. Use admin / admin.'
}
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
  background: #f4f4f4;
  color: #1e293b;
}

button,
input {
  font: inherit;
}

.login-page {
  min-height: 100vh;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  background-image: v-bind(pageBackground);
}

.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 41%) 1fr;
  background: transparent;
}

.visual-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 38px 42px 34px;
  overflow: hidden;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 46, 85, 0.12), rgba(0, 46, 85, 0)),
    radial-gradient(circle at 16% 18%, rgba(20, 184, 166, 0.08), transparent 30%);
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: transparent;
}

.form-wrap {
  width: min(100%, 500px);
  padding: 22px 36px 34px;
  border: 1px solid rgba(226, 232, 240, 0.78);
  border-radius: 24px;
  background: rgba(238, 240, 243, 0.86);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
}

.form-header {
  width: 100%;
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: end;
  column-gap: 18px;
  margin-bottom: 12px;
}

.form-logo {
  display: block;
  width: 200px;
  margin: 0;
  object-fit: contain;
  justify-self: start;
  transform: translate(-68px, 14px);
}

.form-header p {
  margin: 0;
  font-size: 12px;
  color: #7d8796;
}

.helper-text {
  margin: 0 0 10px;
  justify-self: end;
  text-align: right;
  color: #1d6df2;
  line-height: 1;
}

.login-form {
  margin-top: 0;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group + .field-group {
  margin-top: 18px;
}

.field-group label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.field-group input {
  height: 48px;
  padding: 0 14px;
  border: 1px solid #d9e2ec;
  border-radius: 4px;
  background: #ffffff;
  color: #1e293b;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field-group input::placeholder {
  color: #a0aec0;
}

.field-group input:focus {
  border-color: #1d6df2;
  box-shadow: 0 0 0 3px rgba(29, 109, 242, 0.12);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf2f7;
  margin-top: 18px;
}

.text-action {
  padding: 0;
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
}

.primary-action {
  min-width: 100px;
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 4px;
  background: #1d6df2;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.error-message {
  margin: 14px 0 0;
  font-size: 12px;
  color: #dc2626;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .visual-panel {
    min-height: 360px;
  }

  .form-panel {
    padding: 36px 24px 44px;
  }

  .form-wrap {
    padding: 26px 28px 30px;
  }
}

@media (max-width: 640px) {
  .visual-panel {
    padding: 24px 20px 20px;
  }

  .form-logo {
    width: 148px;
  }

  .form-header {
    grid-template-columns: 1fr;
    align-items: flex-start;
    row-gap: 10px;
  }

  .helper-text {
    margin-bottom: 0;
    justify-self: start;
    text-align: left;
  }

  .form-logo {
    transform: none;
  }

  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-action {
    width: 100%;
  }
}
</style>
