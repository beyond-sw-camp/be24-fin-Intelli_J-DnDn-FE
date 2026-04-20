<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showEditDrawer = ref(false)

const site = ref({
  id: 'GN-A-01',
  name: '강남구 재건축 A공구',
  manager: '김철수',
  managerPhone: '010-1234-5678',
  address: '서울 강남구 역삼동',
  period: '2025.01.01 ~ 2026.12.31',
  status: '운영 중',
})

const goBack = () => router.push('/hr/sites')
</script>

<template>
  <div class="h-full font-sans text-gray-800">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
        >
          <span class="text-gray-500">←</span>
        </button>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{{
              site.id
            }}</span>
            <span
              class="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold"
              >{{ site.status }}</span
            >
          </div>
          <h2 class="text-3xl font-bold text-[#1A202C] flex items-center gap-2">
            <span class="text-gray-400">🏢</span> {{ site.name }}
          </h2>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          @click="showEditDrawer = true"
          class="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition flex items-center gap-2"
        >
          <span>📝</span> 현장 정보 수정
        </button>
        <button
          class="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition flex items-center gap-2"
        >
          현장 대시보드 바로가기 <span>→</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 flex flex-col gap-6">
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white">
            <h3 class="font-bold text-[#1A202C] mb-6">현장 기본 정보</h3>
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xl text-gray-600"
              >
                {{ site.manager.charAt(0) }}
              </div>
              <div>
                <p class="text-xs text-gray-400 font-semibold mb-0.5">총 책임자 (현장 소장)</p>
                <p class="font-bold text-[#1A202C] text-lg">
                  {{ site.manager }}
                  <span class="text-sm font-normal text-gray-400 ml-1">{{
                    site.managerPhone
                  }}</span>
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-400 font-semibold mb-1">🗺️ 지역 / 주소</p>
                <p class="font-bold text-sm text-[#1A202C]">{{ site.address }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 font-semibold mb-1">📅 공사 기간</p>
                <p class="font-bold text-sm text-[#1A202C]">{{ site.period }}</p>
              </div>
            </div>
          </div>

          <div
            class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white flex flex-col"
          >
            <h3 class="font-bold text-[#1A202C] mb-6">협력사별 투입 분포</h3>
            <div class="space-y-5 flex-1 justify-center flex flex-col">
              <div>
                <div class="flex justify-between text-xs mb-1.5 font-bold text-gray-600">
                  <span>태양건설 (형틀)</span><span>45명</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 45%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5 font-bold text-gray-600">
                  <span>우주산업 (철근)</span><span>32명</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-emerald-400 h-2 rounded-full" style="width: 32%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5 font-bold text-gray-600">
                  <span>제일환경 (비계)</span><span>18명</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-yellow-400 h-2 rounded-full" style="width: 18%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5 font-bold text-gray-600">
                  <span>직영 (보통인부)</span><span>12명</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-gray-400 h-2 rounded-full" style="width: 12%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 flex-1">
          <div
            class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white flex flex-col justify-between"
          >
            <h3 class="font-bold text-[#1A202C]">오늘 인력 운영 현황</h3>
            <div class="text-center my-6">
              <span class="text-5xl font-light text-[#1A202C]">124</span
              ><span class="text-gray-400 font-medium"> / 145명</span>
              <div class="w-full bg-gray-100 rounded-full h-2 mt-4 mx-auto overflow-hidden">
                <div class="bg-emerald-400 h-2 rounded-full" style="width: 85%"></div>
              </div>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-500 font-bold">출근 완료</span
                ><span class="font-bold text-emerald-500">111명</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 font-bold">지각 / 결근</span
                ><span class="font-bold text-orange-500">13명</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 font-bold">연결된 협력사</span
                ><span class="font-bold text-blue-600">5개</span>
              </div>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white">
            <div class="flex justify-between items-center mb-5">
              <h3 class="font-bold text-[#1A202C]">최근 정산 전송 이력</h3>
              <button class="text-[11px] font-bold text-blue-500 hover:underline">
                정산함 가기
              </button>
            </div>
            <div class="space-y-3">
              <div
                class="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p class="text-sm font-bold text-[#1A202C]">
                    10/14 (오늘)
                    <span class="text-xs font-normal text-gray-400 ml-1">일일 정산</span>
                  </p>
                  <p class="text-xs font-bold text-blue-600 mt-0.5">24,500,000 원</p>
                </div>
                <span
                  class="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold"
                  >검토 대기</span
                >
              </div>
              <div
                class="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p class="text-sm font-bold text-gray-500">
                    10/13 (어제)
                    <span class="text-xs font-normal text-gray-400 ml-1">일일 정산</span>
                  </p>
                  <p class="text-xs font-bold text-blue-400 mt-0.5">25,100,000 원</p>
                </div>
                <span
                  class="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold"
                  >완료</span
                >
              </div>
              <div
                class="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p class="text-sm font-bold text-gray-500">
                    10/12 (수) <span class="text-xs font-normal text-gray-400 ml-1">일일 정산</span>
                  </p>
                  <p class="text-xs font-bold text-blue-400 mt-0.5">23,800,000 원</p>
                </div>
                <span
                  class="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold"
                  >완료</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 flex flex-col gap-6">
        <div
          class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white flex-1"
        >
          <h3 class="font-bold text-[#1A202C] flex items-center gap-2 mb-6">
            <span class="text-red-400">🔔</span> 위험 / 이슈 타임라인
          </h3>
          <div class="border-l-2 border-gray-100 ml-2 space-y-6 pt-1">
            <div class="relative pl-5">
              <div
                class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-red-400 ring-4 ring-white"
              ></div>
              <p class="text-[10px] text-red-400 font-bold mb-1.5">오늘 14:00</p>
              <div class="bg-white border border-red-100 shadow-sm p-3 rounded-2xl">
                <p class="text-xs font-bold text-red-500">[긴급 알림 발송]</p>
                <p class="text-xs text-gray-600 mt-1">강풍 주의 (오후 고소작업 중지)</p>
              </div>
            </div>
            <div class="relative pl-5">
              <div
                class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-400 ring-4 ring-white"
              ></div>
              <p class="text-[10px] text-blue-400 font-bold mb-1.5">오늘 08:30</p>
              <div class="bg-white border border-gray-100 shadow-sm p-3 rounded-2xl">
                <p class="text-xs text-gray-600">현장 소장 일일 회의 및 TBM 시작</p>
              </div>
            </div>
            <div class="relative pl-5">
              <div
                class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-white"
              ></div>
              <p class="text-[10px] text-emerald-400 font-bold mb-1.5">오늘 07:00</p>
              <div class="bg-white border border-gray-100 shadow-sm p-3 rounded-2xl">
                <p class="text-xs text-gray-600">출근 QR 스캐너 활성화</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white">
          <div class="flex justify-between items-center mb-5">
            <h3 class="font-bold text-[#1A202C]">최근 작업 일보</h3>
            <span class="text-blue-400">📄</span>
          </div>
          <ul class="space-y-2">
            <li
              class="flex justify-between bg-white shadow-sm p-3 rounded-2xl items-center border border-gray-100"
            >
              <span class="font-bold text-[#2D3748] text-xs">10/14 (오늘)</span>
              <span class="truncate w-32 text-right text-xs text-gray-600"
                >지하 2층 슬라브 형틀</span
              >
            </li>
            <li
              class="flex justify-between p-3 items-center bg-gray-50/50 rounded-2xl border border-transparent"
            >
              <span class="text-gray-400 text-xs">10/13 (어제)</span>
              <span class="truncate w-32 text-right text-xs text-gray-500">지하 2층 기둥 철근</span>
            </li>
            <li
              class="flex justify-between p-3 items-center bg-gray-50/50 rounded-2xl border border-transparent"
            >
              <span class="text-gray-400 text-xs">10/12 (수)</span>
              <span class="truncate w-32 text-right text-xs text-gray-500"
                >기초 바닥 콘크리트 ...</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
