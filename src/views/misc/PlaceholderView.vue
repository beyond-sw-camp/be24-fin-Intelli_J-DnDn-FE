<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div
    class="rounded-2xl border border-forena-100/90 bg-white/90 p-8 shadow-card backdrop-blur-sm"
  >
    <p class="text-[10px] font-bold uppercase tracking-wider text-flare-600">Coming soon</p>
    <h2 class="mt-2 text-xl font-bold text-forena-900">{{ route.meta.title }}</h2>
    <p class="mt-3 text-sm text-slate-600">This screen is reserved per the new menu structure.</p>
  </div>
</template>
