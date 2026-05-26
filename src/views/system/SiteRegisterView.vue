<script setup>
import { Plus } from 'lucide-vue-next'
import { useSiteRegister } from '@/composables/system/useSiteRegister'
import SiteRegisterHubSection from '@/components/system/site/SiteRegisterHubSection.vue'
import SiteProjectsSection from '@/components/system/site/SiteProjectsSection.vue'
import SiteRegisterModals from '@/components/system/site/SiteRegisterModals.vue'

const reg = useSiteRegister()
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      v-if="reg.toastMsg"
      class="fixed top-16 left-1/2 z-[100] max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg"
      :class="
        reg.toastVariant === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : reg.toastVariant === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-sky-200 bg-sky-50 text-sky-900'
      "
    >
      {{ reg.toastMsg }}
    </div>

    <div class="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">
          {{ reg.T.kicker }}
        </p>
        <h1 class="text-xl font-bold text-forena-900">{{ reg.T.title }}</h1>
      </div>
      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
          @click="reg.openSiteModal"
        >
          <Plus class="h-3.5 w-3.5 shrink-0" />
          {{ reg.T.registerSite }}
        </button>
      </div>
    </div>

    <SiteRegisterHubSection
      :T="reg.T"
      :hub-sections="reg.hubSections"
      :expanded="reg.expanded"
      :account-status-thead-class="reg.accountStatusTheadClass"
      @toggle-accordion="reg.accordionToggle"
      @edit="reg.openEditModal"
      @activate="reg.activateAccount"
      @deactivate="reg.deactivateAccount"
    />

    <SiteProjectsSection
      :T="reg.T"
      :rows="reg.rows"
      @open-site-accounts="reg.openSiteAccounts"
      @edit-site="reg.openEditSite"
      @deactivate-site="reg.deactivateSite"
      @activate-site="reg.activateSite"
    />

    <SiteRegisterModals
      :T="reg.T"
      :ROLE_OPTIONS_HUB="reg.ROLE_OPTIONS_HUB"
      :site-modal-open="reg.siteModalOpen"
      :form="reg.form"
      :site-edit-open="reg.siteEditOpen"
      :edit-site-form="reg.editSiteForm"
      :modal-open="reg.modalOpen"
      :form-edit="reg.formEdit"
      :format-site-code="reg.formatSiteCode"
      :format-phone-number="reg.formatPhoneNumber"
      :format-email-input="reg.formatEmailInput"
      :normalize-email="reg.normalizeEmail"
      @close-site-modal="reg.closeSiteModal"
      @submit-register="reg.submitRegister"
      @close-site-edit="reg.closeSiteEdit"
      @submit-site-edit="reg.submitSiteEdit"
      @close-account-modal="reg.closeAccountModal"
      @submit-account-modal="reg.submitAccountModal"
      @notify-password-reset="reg.notifyPasswordResetEmailSent"
    />
  </div>
</template>
