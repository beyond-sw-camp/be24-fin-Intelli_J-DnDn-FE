<template>
  <div class="login-page" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="overlay"></div>

    <div class="login-container">
      <div class="brand-section">
        <h1 class="brand-title">DnDn</h1>
      </div>

      <div class="login-card">
        <div class="card-header">
          <h2>로그인</h2>
          <p>현장 운영 시스템에 접속하세요</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="input-group">
            <label for="userId">아이디</label>
            <input
              id="userId"
              v-model="loginForm.userId"
              type="text"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div class="input-group">
            <label for="password">비밀번호</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" />
              <span>로그인 상태 유지</span>
            </label>

            <button type="button" class="text-btn">비밀번호 찾기</button>
          </div>

          <button type="submit" class="login-btn">로그인</button>
        </form>

        <div class="divider"></div>

        <div class="bottom-actions">
          <button type="button" class="outline-btn">현장 관리자 문의</button>
          <button type="button" class="outline-btn">작업자 최초 등록</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import bgImage from '@/assets/hanwha-bg.png'

const router = useRouter()
const auth = useAuthStore()

const loginForm = reactive({
  userId: '',
  password: '',
})

const rememberMe = ref(false)

const loginError = ref('')

function handleLogin() {
  loginError.value = ''
  if (auth.login(loginForm.userId, loginForm.password)) {
    router.push({ path: '/site/dashboard' })
    return
  }
  loginError.value = '아이디 또는 비밀번호가 올바르지 않습니다. (admin / admin)'
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(12, 24, 40, 0.72) 0%,
    rgba(12, 24, 40, 0.58) 38%,
    rgba(230, 90, 30, 0.18) 100%
  );
  backdrop-filter: blur(2px);
}
.brand-section {
  color: #fff;
  padding: 24px 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1240px;
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 36px;
  align-items: center;
}

.brand-sub {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
  margin-bottom: 16px;
}

.brand-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.05;
  margin: 0 0 20px;
  color: #ffffff;
}

.brand-desc {
  max-width: 560px;
  font-size: 18px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 28px;
}

.brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.brand-tags span {
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 14px;
  backdrop-filter: blur(8px);
}

.login-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  padding: 36px 32px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(20px);
}

.card-header {
  margin-bottom: 28px;
}

.card-header h2 {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.card-header p {
  font-size: 15px;
  color: #6b7280;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.input-group input {
  height: 52px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 16px;
  font-size: 15px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
}

.input-group input:focus {
  border-color: #f37321;
  box-shadow: 0 0 0 4px rgba(243, 115, 33, 0.14);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  margin-bottom: 4px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
}

.text-btn {
  border: none;
  background: transparent;
  color: #f37321;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.login-btn {
  height: 54px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #f37321, #ea580c);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  box-shadow: 0 14px 24px rgba(234, 88, 12, 0.26);
}

.login-btn:hover {
  transform: translateY(-1px);
}

.login-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.divider {
  position: relative;
  margin: 24px 0 18px;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: 1px solid #e5e7eb;
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.88);
  color: #9ca3af;
  font-size: 13px;
}

.bottom-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.outline-btn {
  height: 48px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.outline-btn:hover {
  border-color: #f37321;
  color: #f37321;
}

@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 720px;
  }

  .brand-section {
    padding-bottom: 0;
  }

  .brand-title {
    font-size: 42px;
  }

  .brand-desc {
    font-size: 16px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .login-card {
    padding: 28px 20px;
    border-radius: 22px;
  }

  .brand-title {
    font-size: 34px;
  }

  .bottom-actions {
    grid-template-columns: 1fr;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
