<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { putAuthChangePassword } from '@/api/auth'

const T = {
  kicker: '계정',
  title: '비밀번호 수정',
  hint: '현재 비밀번호와 새 비밀번호(8자 이상)를 입력해 주세요.',
  current: '현재 비밀번호',
  next: '새 비밀번호',
  confirm: '새 비밀번호 확인',
  save: '변경',
  back: '돌아가기',
  mismatch: '새 비밀번호가 서로 일치하지 않습니다.',
  short: '새 비밀번호는 8자 이상으로 입력해 주세요.',
}

const router = useRouter()
const submitting = ref(false)
const banner = ref('')
const bannerKind = ref(/** @type {'ok'|'err'} */ ('ok'))

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function submit() {
  banner.value = ''
  const cur = String(form.currentPassword || '').trim()
  const nw = String(form.newPassword || '').trim()
  const cf = String(form.confirmPassword || '').trim()
  if (nw.length < 8) {
    banner.value = T.short
    bannerKind.value = 'err'
    return
  }
  if (nw !== cf) {
    banner.value = T.mismatch
    bannerKind.value = 'err'
    return
  }
  submitting.value = true
  try {
    await putAuthChangePassword({ currentPassword: cur, newPassword: nw })
    banner.value = '비밀번호가 변경되었습니다.'
    bannerKind.value = 'ok'
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e) {
    banner.value =
      /** @type {Error} */ (e).message || '비밀번호 변경에 실패했습니다. 서버(`/auth/password`) 규격을 확인해 주세요.'
    bannerKind.value = 'err'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/site/dashboard')
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6 pb-12">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-forena-600 transition hover:text-forena-900"
      @click="goBack"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      {{ T.back }}
    </button>

    <div>
      <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ T.kicker }}</p>
      <h1 class="text-xl font-bold text-forena-900">{{ T.title }}</h1>
      <p class="mt-2 text-sm text-forena-600">{{ T.hint }}</p>
    </div>

    <section
      class="rounded-2xl border border-flare-100/80 bg-white p-5 shadow-[0_10px_40px_rgba(0,46,85,0.06)]"
    >
      <p
        v-if="banner"
        class="mb-4 rounded-lg px-3 py-2 text-xs font-semibold"
        :class="bannerKind === 'err' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-900'"
      >
        {{ banner }}
      </p>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.current }}</span>
          <input
            v-model="form.currentPassword"
            type="password"
            class="w-full rounded-lg border border-forena-200/90 bg-white px-3 py-2.5 text-sm shadow-sm"
            autocomplete="current-password"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.next }}</span>
          <input
            v-model="form.newPassword"
            type="password"
            class="w-full rounded-lg border border-forena-200/90 bg-white px-3 py-2.5 text-sm shadow-sm"
            autocomplete="new-password"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.confirm }}</span>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="w-full rounded-lg border border-forena-200/90 bg-white px-3 py-2.5 text-sm shadow-sm"
            autocomplete="new-password"
          />
        </label>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-sm font-bold text-white shadow-sm hover:from-forena-800 hover:to-black disabled:opacity-50"
        >
          {{ submitting ? '처리 중…' : T.save }}
        </button>
      </form>
    </section>
  </div>
</template>
