<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { Plus, RefreshCw, X } from 'lucide-vue-next'
import { getProjectList, createProject } from '@/api/project.js'
import { getAdminAccounts } from '@/api/auth.js'
import { USER_ROLE } from '@/stores/authStore'

const T = {
  kicker: '시스템 관리',
  title: '현장 등록',
  reload: '목록 새로고침',
  reloadBusy: '불러오는 중…',
  registerSite: '현장 등록',
  colCode: '현장 코드',
  colName: '현장 명',
  colDirectorName: '현장 총 책임자',
  colDirectorPhone: '총 책임자 휴대폰',
  colAddress: '현장 주소',
  empty: '등록된 현장이 없습니다.',
  modalTitle: '신규 현장 등록',
  fieldCode: '현장 코드',
  fieldName: '현장 명',
  fieldAddress: '현장 주소',
  save: '등록',
  cancel: '취소',
  codePh: '예: GN-A',
  namePh: '현장 표시명',
  addrPh: '도로명 또는 지번 주소',
}

function parseProjectLabel(name) {
  const s = String(name || '').trim()
  const m = /^\s*\[(?<code>[^\]]+)\]\s*(?<rest>.+)$/.exec(s)
  if (m?.groups) {
    return { code: m.groups.code.trim(), displayName: m.groups.rest.trim() }
  }
  return { code: '', displayName: s }
}

const loading = ref(false)
/** @type {import('vue').Ref<Array<Record<string, unknown> & { idx: number, name: string, location?: string }>>} */
const projects = ref([])

/** @type {import('vue').Ref<any[]>} */
const directorAccounts = ref([])

function accountRoleString(a) {
  const r = a?.role
  if (r && typeof r === 'object' && r !== null && 'name' in r) return String(/** @type {{ name?: string }} */ (r).name || '')
  return String(r || '')
}

function directorFromAccounts(siteCodeRaw) {
  const siteCode = String(siteCodeRaw || '').trim()
  if (!siteCode) return null
  const candidates = directorAccounts.value.filter(
    (a) =>
      accountRoleString(a) === USER_ROLE.SITE_DIRECTOR &&
      String(a?.siteCode || '').trim() === siteCode &&
      a?.active !== false,
  )
  if (!candidates.length) return null
  candidates.sort((x, y) => String(x?.name || '').localeCompare(String(y?.name || ''), 'ko'))
  return candidates[0]
}

function pickDirectorFields(p, accRow) {
  const n =
    p.siteDirectorName ??
    p.directorName ??
    p.managerName ??
    accRow?.name
  const ph =
    p.siteDirectorPhone ??
    p.directorPhone ??
    p.managerPhone ??
    accRow?.phone
  return {
    directorName: String(n || '').trim() || '—',
    directorPhone: String(ph || '').trim() || '—',
  }
}

const modalOpen = ref(false)
const form = reactive({
  siteCode: '',
  siteName: '',
  address: '',
})

async function refreshList() {
  loading.value = true
  try {
    const [list, accs] = await Promise.all([
      getProjectList(),
      getAdminAccounts().catch(() => []),
    ])
    projects.value = Array.isArray(list) ? list.slice() : []
    const arr = Array.isArray(accs) ? accs : []
    directorAccounts.value = arr
  } catch (e) {
    window.alert(e?.message || '현장 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const rows = computed(() =>
  projects.value.map((p) => {
    const { code, displayName } = parseProjectLabel(p.name)
    const accRow = directorFromAccounts(code)
    const { directorName, directorPhone } = pickDirectorFields(p, accRow)
    return {
      idx: p.idx,
      code: code || '—',
      displayName: displayName || '—',
      directorName,
      directorPhone,
      address: p.location?.trim() ? p.location : '—',
    }
  }),
)

onMounted(() => {
  refreshList()
})

function openModal() {
  form.siteCode = ''
  form.siteName = ''
  form.address = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function submitRegister() {
  const code = String(form.siteCode || '').trim()
  const name = String(form.siteName || '').trim()
  const address = String(form.address || '').trim()
  if (!code || !name || !address) {
    window.alert('현장 코드, 현장 명, 주소를 모두 입력해 주세요.')
    return
  }
  const combinedName = `[${code}] ${name}`
  const start = new Date()
  const end = new Date(start)
  end.setFullYear(end.getFullYear() + 1)
  try {
    await createProject({
      name: combinedName,
      location: address,
      startDate: isoDate(start),
      endDate: isoDate(end),
    })
    closeModal()
    await refreshList()
  } catch (e) {
    window.alert(e?.message || '현장 등록에 실패했습니다.')
  }
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div class="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ T.kicker }}</p>
        <h1 class="text-xl font-bold text-forena-900">{{ T.title }}</h1>
      </div>
      <div class="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-800 shadow-sm hover:bg-forena-50 disabled:opacity-50"
          :disabled="loading"
          @click="refreshList"
        >
          <RefreshCw class="h-3.5 w-3.5 shrink-0 text-flare-600" :class="{ 'animate-spin': loading }" />
          {{ loading ? T.reloadBusy : T.reload }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
          @click="openModal"
        >
          <Plus class="h-3.5 w-3.5" />
          {{ T.registerSite }}
        </button>
      </div>
    </div>

    <section class="overflow-hidden rounded-xl border border-forena-100 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wide text-forena-500"
          >
            <tr>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colCode }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colName }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colDirectorName }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colDirectorPhone }}</th>
              <th class="px-3 py-3">{{ T.colAddress }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="!rows.length">
              <td colspan="5" class="px-3 py-10 text-center text-sm text-slate-400">{{ T.empty }}</td>
            </tr>
            <tr
              v-for="r in rows"
              :key="r.idx"
              class="border-b border-forena-50 transition hover:bg-flare-50/30"
            >
              <td class="whitespace-nowrap px-3 py-3 font-mono text-xs text-forena-800">{{ r.code }}</td>
              <td class="px-3 py-3">
                <span class="font-semibold text-forena-900">{{ r.displayName }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-sm font-medium text-forena-900">{{ r.directorName }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-xs font-medium">{{ r.directorPhone }}</td>
              <td class="px-3 py-3 text-xs font-medium text-forena-700">{{ r.address }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeModal"
      >
        <div
          class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between border-b border-forena-50 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">{{ T.modalTitle }}</h2>
            <button type="button" class="rounded-lg p-1 text-forena-400 hover:bg-forena-50" @click="closeModal">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-3 px-4 py-4 text-sm">
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldCode }}</span>
              <input
                v-model="form.siteCode"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 font-mono text-sm"
                :placeholder="T.codePh"
                autocomplete="off"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldName }}</span>
              <input
                v-model="form.siteName"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.namePh"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldAddress }}</span>
              <input
                v-model="form.address"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.addrPh"
              />
            </label>
          </div>
          <div class="flex gap-2 border-t border-forena-50 bg-forena-50/40 px-4 py-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 bg-white py-2.5 text-xs font-bold text-forena-700"
              @click="closeModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-xs font-bold text-white hover:from-forena-800 hover:to-black"
              @click="submitRegister"
            >
              {{ T.save }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
