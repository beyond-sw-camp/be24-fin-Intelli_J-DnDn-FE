<!--
  GanttView.vue — ganttParser.js 연동 사용 예시
  ──────────────────────────────────────────────
  기존 전체공정표 컴포넌트에서 아래 두 가지만 바꾸면 됩니다.

  ① mock 데이터 블록 → fetchAndParseGantt() 호출로 교체
  ② 선택적으로 warnings 배열을 검증 경고 UI에 연결
-->
<script setup>
import { ref, onMounted } from 'vue'
import { fetchAndParseGantt, parseGanttJSON } from '@/utils/ganttParser.js'

// ─── 기존 코드와 동일한 ref들 ────────────────────────────────────────
const projectInfo = ref({})
const aiTasks     = ref([])
const milestones  = ref([])
const warnings    = ref([])   // 검증 경고 — 기존 validation computed 대신 또는 병행 사용

const isLoading   = ref(false)
const loadError   = ref(null)


// ─── 방법 A: API 서버에서 fetch (권장) ───────────────────────────────
async function loadFromApi() {
  isLoading.value = true
  loadError.value = null
  try {
    const result = await fetchAndParseGantt('/api/projects/1/schedule')

    projectInfo.value = result.projectInfo
    aiTasks.value     = result.tasks
    milestones.value  = result.milestones
    warnings.value    = result.warnings
  } catch (err) {
    loadError.value = err.message
    console.error('[ganttParser] 로드 실패:', err)
  } finally {
    isLoading.value = false
  }
}


// ─── 방법 B: 하드코딩 JSON (개발/데모용) ─────────────────────────────
function loadFromHardcoded() {
  const json = {
    프로젝트: {
      이름:   '강남 복합개발 1공구 신축공사',
      시작일: '2025-03-01',
      종료일: '2026-09-30',
      담당자: '박현수 (현장 총책임자)',
    },
    공정목록: [
      { 공사: '토목', 공정: '터파기 및 흙막이', 시작일: '2025-03-01', 종료일: '2025-04-15', CP: true,  보할: 8  },
      { 공사: '토목', 공정: '기초 콘크리트',    시작일: '2025-04-16', 종료일: '2025-05-31', CP: true,  보할: 10, 선행: '터파기 및 흙막이' },
      { 공사: '골조', 공정: 'B3 ~ B1 골조',     시작일: '2025-06-01', 종료일: '2025-08-31', CP: true,  보할: 15, 선행: '기초 콘크리트'   },
      { 공사: '골조', 공정: '지상 1~5층 골조',  시작일: '2025-09-01', 종료일: '2025-11-30', CP: true,  보할: 12, 선행: 'B3 ~ B1 골조'    },
      { 공사: '전기', 공정: '전기 간선 배관',    시작일: '2025-09-15', 종료일: '2025-12-31', CP: false, 보할: 6  },
      { 공사: '설비', 공정: '급배수 배관',       시작일: '2025-10-01', 종료일: '2026-02-28', CP: false, 보할: 7  },
      { 공사: '골조', 공정: '지상 6~15층 골조',  시작일: '2025-12-01', 종료일: '2026-03-31', CP: true,  보할: 14, 선행: '지상 1~5층 골조' },
      { 공사: '마감', 공정: '외벽 커튼월',       시작일: '2026-02-01', 종료일: '2026-06-30', CP: false, 보할: 10 },
      { 공사: '마감', 공정: '내부 마감 공사',    시작일: '2026-04-01', 종료일: '2026-08-31', CP: false, 보할: 11 },
      { 공사: '준공', 공정: '준공 검사 및 인수', 시작일: '2026-08-01', 종료일: '2026-09-30', CP: true,  보할: 7  },
    ],
    // 마일스톤 생략 → 자동 생성됨
  }

  const result = parseGanttJSON(json)
  projectInfo.value = result.projectInfo
  aiTasks.value     = result.tasks
  milestones.value  = result.milestones
  warnings.value    = result.warnings
}


// ─── 방법 C: 파일 업로드 후 파싱 ─────────────────────────────────────
async function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const text = await file.text()
  try {
    const result = parseGanttJSON(text)
    projectInfo.value = result.projectInfo
    aiTasks.value     = result.tasks
    milestones.value  = result.milestones
    warnings.value    = result.warnings
  } catch (err) {
    loadError.value = `JSON 파싱 오류: ${err.message}`
  }
}


// ─── 초기 로드 ────────────────────────────────────────────────────────
onMounted(() => {
  // 개발 중에는 loadFromHardcoded(), 운영에서는 loadFromApi() 로 교체
  loadFromHardcoded()
})
</script>

<template>
  <div>
    <!-- 로딩 / 오류 상태 -->
    <div v-if="isLoading" class="text-sm text-forena-500">공정 데이터 로딩 중...</div>
    <div v-if="loadError" class="rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700">
      {{ loadError }}
    </div>

    <!-- 검증 경고 (warnings 배열 연결) -->
    <div
      v-if="warnings.length"
      class="rounded-xl border border-amber-200 bg-amber-50/40 p-4"
    >
      <p class="mb-2 text-xs font-bold text-amber-800">공정 검증 ({{ warnings.length }}건)</p>
      <ul class="space-y-1">
        <li
          v-for="(w, i) in warnings"
          :key="i"
          class="flex gap-2 text-xs"
          :class="w.level === 'error' ? 'text-rose-700' : w.level === 'warn' ? 'text-amber-800' : 'text-sky-700'"
        >
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                :class="w.level === 'error' ? 'bg-rose-500' : w.level === 'warn' ? 'bg-amber-500' : 'bg-sky-500'"></span>
          {{ w.msg }}
        </li>
      </ul>
    </div>

    <!--
      이하 기존 간트차트 / 테이블 / 마일스톤 UI 그대로 사용
      aiTasks, milestones, projectInfo ref가 채워지면 자동 렌더링됩니다.
    -->
  </div>
</template>