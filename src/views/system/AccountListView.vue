<script setup>
import { ChevronDown, Plus, ArrowLeft } from 'lucide-vue-next'
import { useAccountList } from '@/composables/system/useAccountList'
import AccountStatusSection from '@/components/system/account/AccountStatusSection.vue'
import AccountModals from '@/components/system/account/AccountModals.vue'

const list = useAccountList()
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      v-if="list.toastMsg"
      class="fixed top-16 left-1/2 z-[300] max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg"
      :class="
        list.toastVariant === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : list.toastVariant === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-sky-200 bg-sky-50 text-sky-900'
      "
    >
      {{ list.toastMsg }}
    </div>

    <div class="flex shrink-0 flex-col gap-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">
            {{ list.T.kicker }}
          </p>
          <div class="mt-1 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
            <h1 class="text-xl font-bold leading-tight text-forena-900">{{ list.T.title }}</h1>
            <label
              class="relative inline-flex min-w-0 max-w-[min(100%,22rem)] flex-1 items-center sm:flex-initial"
            >
              <span class="sr-only">{{ list.currentSiteDisplay }}</span>
              <select
                class="w-full min-w-0 cursor-pointer appearance-none border-0 border-b border-forena-200/70 bg-transparent py-0.5 pr-7 pb-1 pl-0 text-sm font-semibold text-forena-900 shadow-none transition hover:border-flare-400/70 focus:border-flare-500 focus:outline-none focus:ring-0"
                :value="Number.isFinite(list.projectIdxParam) ? list.projectIdxParam : ''"
                :aria-label="list.currentSiteDisplay"
                @change="list.onSiteSwitcherChange"
              >
                <option v-for="p in list.sortedProjectOptions" :key="p.idx" :value="p.idx">
                  {{ list.projectOptionLabel(p) }}
                </option>
              </select>
              <ChevronDown
                class="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-forena-500/75"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
            @click="list.openCreateModal"
          >
            <Plus class="h-3.5 w-3.5 shrink-0" />
            {{ list.T.newAccount }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-800 shadow-sm hover:bg-forena-50"
            @click="list.goBackToSiteHub"
          >
            <ArrowLeft class="h-3.5 w-3.5 shrink-0 text-flare-600" />
            {{ list.T.backToSites }}
          </button>
        </div>
      </div>
    </div>

    <AccountStatusSection
      :T="list.T"
      v-model:worker-affiliation-tab="list.workerAffiliationTab"
      :director-field-accounts="list.directorFieldAccounts"
      :hq-field-accounts="list.hqFieldAccounts"
      :trade-field-accounts="list.tradeFieldAccounts"
      :trade-grouped-rows="list.tradeGroupedRows"
      :trade-accordion-open="list.tradeAccordionOpen"
      :account-status-thead-class="list.accountStatusTheadClass"
      @edit="list.openEditModal"
      @activate="list.activateAccount"
      @deactivate="list.deactivateAccount"
      @toggle-trade-accordion="list.toggleTradeAccordion"
    />

    <AccountModals
      :T="list.T"
      :ROLE_OPTIONS="list.ROLE_OPTIONS"
      :modal-open="list.modalOpen"
      :modal-mode="list.modalMode"
      :form-create="list.formCreate"
      :form-edit="list.formEdit"
      :project-options="list.projectOptions"
      :sorted-project-options="list.sortedProjectOptions"
      :trade-options="list.tradeOptions"
      :edit-trade-options="list.editTradeOptions"
      :trade-loading="list.tradeLoading"
      :edit-trade-loading="list.editTradeLoading"
      :needs-site-for-role="list.needsSiteForRole"
      :needs-trade="list.needsTrade"
      :edit-needs-site="list.editNeedsSite"
      :edit-needs-trade="list.editNeedsTrade"
      :selected-project-label="list.selectedProjectLabel"
      :email-check-state="list.emailCheckState"
      :approve-open="list.approveOpen"
      v-model:approve-password="list.approvePassword"
      :reject-open="list.rejectOpen"
      v-model:reject-note="list.rejectNote"
      :request-detail-open="list.requestDetailOpen"
      :selected-request="list.selectedRequest"
      :bulk-reject-open="list.bulkRejectOpen"
      v-model:bulk-reject-note-input="list.bulkRejectNoteInput"
      :bulk-reject-busy="list.bulkRejectBusy"
      :bulk-reject-eligible="list.bulkRejectEligible"
      :format-login-id="list.formatLoginId"
      :format-phone-number="list.formatPhoneNumber"
      :format-email-input="list.formatEmailInput"
      :normalize-email="list.normalizeEmail"
      :project-option-label="list.projectOptionLabel"
      :status-label="list.statusLabel"
      :is-pending-request="list.isPendingRequest"
      :request-row-title="list.requestRowTitle"
      :request-row-detail-text="list.requestRowDetailText"
      :request-site-name-for-detail="list.requestSiteNameForDetail"
      :format-req-date="list.formatReqDate"
      :request-row-requested-role-str="list.requestRowRequestedRoleStr"
      :request-row-role-str="list.requestRowRoleStr"
      @close-modal="list.closeModal"
      @submit-modal="list.submitModal"
      @create-email-input="list.onCreateEmailInput"
      @notify-password-reset="list.notifyPasswordResetEmailSent"
      @close-request-detail="list.closeRequestDetail"
      @start-approve-from-detail="list.startApproveFromDetail"
      @start-reject-from-detail="list.startRejectFromDetail"
      @close-approve="list.closeApprove"
      @submit-approve="list.submitApprove"
      @close-reject="list.closeReject"
      @submit-reject="list.submitReject"
      @close-bulk-reject="list.closeBulkRejectModal"
      @submit-bulk-reject="list.submitBulkRejectRequests"
    />
  </div>
</template>
