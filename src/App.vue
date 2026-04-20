<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'

const route = useRoute()

const isLoginRoute = computed(() => route.name === 'login' || route.path === '/login')
</script>

<template>
  <template v-if="isLoginRoute">
    <div class="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto">
      <RouterView />
    </div>
  </template>
  <div
    v-else
    class="relative flex min-h-0 flex-1 overflow-hidden bg-mesh-page bg-forena-50 text-slate-900"
  >
    <AppSidebar />
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <main class="min-h-0 flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
