<script setup>
// feat : Vue Composition API 및 외부 라이브러리 임포트
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/api/index'
import {
  CalendarDays, ChevronLeft, ChevronRight, FileText, Plus, Save, Upload,
  Image as ImageIcon, Paperclip, X, Users, Wrench, MapPin, ClipboardList,
  CheckCircle2, AlertTriangle, Clock, Send, Eye, Pencil, FileCheck2, Layers,
  ShieldCheck, UserCog, Trash2, Download
} from 'lucide-vue-next'

// feat : 사용자 권한 상수 정의
const ROLES = {
  MANAGER: 'site_manager',
  WORKER:  'process_owner',
}

const currentRole = ref(ROLES.WORKER)
const myProcess = ref('철근')
const ALL_PROCESSES = ['토공', '골조', '철근', '전기', '설비', '마감']

// feat : 공정 카테고리별 투입 가능한 중장비 목록 데이터
const equipmentList = {
  '굴착·토공': ['굴삭기', '미니굴삭기', '백호', '드래그라인'],
  '운반': ['덤프트럭', '트럭 믹서', '트랙터', '트레일러', '스크레이퍼'],
  '하역·양중': ['타워크레인', '모바일 크레인', '크롤러 크레인', '지게차', '리프트'],
  '정지·다짐': ['불도저', '모터 그레이더', '롤러', '콤팩터'],
  '도로·포장': ['아스팔트 피니셔', '밀링 머신', '살수차', '노면 절단기'],
  '기초·파일': ['파일 드라이버', '보링머신', '어스오거', 'RCD'],
  '콘크리트': ['콘크리트 펌프카', '배치 플랜트', '바이브레이터'],
  '철거·특수': ['브레이커', '니블러', '크러셔', '고소작업차', 'TBM'],
}

// 🔥 feat : 백엔드 Enum 영문명 -> 한글 장비명 완벽 번역 맵 추가
const EQ_ENUM_MAP = {
  'EXCAVATOR': '굴삭기', 'MINI_EXCAVATOR': '미니굴삭기', 'BACKHOE': '백호', 'DRAGLINE': '드래그라인',
  'DUMP_TRUCK': '덤프트럭', 'TRUCK_MIXER': '트럭 믹서', 'TRACTOR': '트랙터', 'TRAILER': '트레일러', 'SCRAPER': '스크레이퍼',
  'TOWER_CRANE': '타워크레인', 'MOBILE_CRANE': '모바일 크레인', 'CRAWLER_CRANE': '크롤러 크레인', 'FORKLIFT': '지게차', 'LIFT': '리프트',
  'BULLDOZER': '불도저', 'MOTOR_GRADER': '모터 그레이더', 'ROLLER': '롤러', 'COMPACTOR': '콤팩터',
  'ASPHALT_FINISHER': '아스팔트 피니셔', 'MILLING_MACHINE': '밀링 머신', 'WATER_TRUCK': '살수차', 'ROAD_CUTTER': '노면 절단기',
  'PILE_DRIVER': '파일 드라이버', 'BORING_MACHINE': '보링머신', 'EARTH_AUGER': '어스오거', 'RCD': 'RCD',
  'CONCRETE_PUMP': '콘크리트 펌프카', 'BATCH_PLANT': '배치 플랜트', 'VIBRATOR': '바이브레이터',
  'BREAKER': '브레이커', 'NIBBLER': '니블러', 'CRUSHER': '크러셔', 'AERIAL_WORK_PLATFORM': '고소작업차', 'TBM': 'TBM'
}

function getEqKorName(name) {
  if (!name) return '장비';
  const upperName = name.toUpperCase();
  return EQ_ENUM_MAP[upperName] || name;
}

// feat : 날짜 처리 유틸리티 함수
function todayStr() { return new Date().toISOString().slice(0, 10) }
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtKor(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dow = ['일','월','화','수','목','금','토'][d.getDay()]
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${dow})`
}

const selectedDate = ref(todayStr())
const tomorrowDate = computed(() => addDays(selectedDate.value, 1))
function prevDay() { selectedDate.value = addDays(selectedDate.value, -1) }
function nextDay() { selectedDate.value = addDays(selectedDate.value, 1) }
function goToday() { selectedDate.value = todayStr() }
const isToday = computed(() => selectedDate.value === todayStr())

const activeTab = ref('today')
const modalTab = ref('today')

function switchTab(tab) {
  if (tab === 'consolidated' && currentRole.value !== ROLES.MANAGER) return
  activeTab.value = tab
}

const reports = ref([]);

// feat : 특정 일자의 공사일보 데이터를 조회
async function loadReportsForDate(targetDate) {
  try {
    const res = await api.get('/report/', { params: { date: targetDate } });
    const dbReports = Array.isArray(res) ? res : (res.data?.data || res.data || []);

    const toDateString = (dateVal) => {
      if (Array.isArray(dateVal)) {
        return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`;
      }
      return dateVal;
    };

    reports.value = dbReports.map(db => ({
      id: db.idx,
      workPlanId: db.workPlanId,
      date: toDateString(db.reportDate),
      process: db.tradeType || db.process || '공정',
      workers: db.actualWorkerCount || 0,
      equipmentCount: 0,
      equipmentList: [],
      todayWork: db.todayWork || '',
      tomorrowPlan: db.tomorrowPlan || '',
      progress: db.todayProgress || 0, 
      processProgress: db.actualProgress || 0,
      notes: db.issue || '',
      completion: (db.actualProgress >= 100) ? '완료' : '미완료',
      status: '제출 완료',
      _placeholder: false
    }));
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
}

onMounted(() => {
  loadReportsForDate(selectedDate.value);
  document.addEventListener('keydown', onKeydown);
});

watch(selectedDate, (newDate) => {
  loadReportsForDate(newDate);
});

const STATUS_META = {
  '작성 전':   { cls: 'bg-slate-100 text-slate-500 ring-slate-200',         icon: Clock },
  '임시 저장': { cls: 'bg-amber-50 text-amber-700 ring-amber-200',          icon: Pencil },
  '제출 완료': { cls: 'bg-sky-50 text-sky-700 ring-sky-200',                icon: Send },
  '검토 중':   { cls: 'bg-violet-50 text-violet-700 ring-violet-200',       icon: Eye },
  '승인 완료': { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',    icon: CheckCircle2 },
  '반려':      { cls: 'bg-rose-50 text-rose-700 ring-rose-200',             icon: AlertTriangle },
}

function statusMeta(s) { return STATUS_META[s] || STATUS_META['작성 전'] }

const visibleProcesses = computed(() => {
  if (currentRole.value === ROLES.WORKER) return [myProcess.value]
  return ALL_PROCESSES
})

function reportsForDate(dateStr) {
  return visibleProcesses.value.map(proc => {
    const found = reports.value.find(r => r.date === dateStr && r.process === proc)
    if (found) return found
    return {
      id: `placeholder_${proc}_${dateStr}`,
      date: dateStr, process: proc,
      author: '-', location: '-', workers: 0, equipmentCount: 0,
      equipmentList: [], todayWork: '', tomorrowPlan: '',
      progress: 0, processProgress: 0, completion: '미완료', notes: '',
      photos: [], files: [],
      status: '작성 전', submittedAt: null,
      _placeholder: true,
    }
  })
}

const todayReports = computed(() => reportsForDate(selectedDate.value))
const tomorrowReports = computed(() => reportsForDate(tomorrowDate.value))

const stats = computed(() => {
  const list = todayReports.value
  const total = list.length
  const submitted = list.filter(r => ['제출 완료','검토 중','승인 완료'].includes(r.status)).length
  const pending = list.filter(r => r.status === '작성 전' || r.status === '임시 저장').length
  const completed = list.filter(r => r.completion === '완료' && !r._placeholder).length
  const totalWorkers = list.reduce((s, r) => s + (r.workers || 0), 0)
  const totalEquip = list.reduce((s, r) => s + (r.equipmentCount || 0), 0)
  const avgProgress = total ? Math.round(list.reduce((s, r) => s + (r.processProgress || 0), 0) / total) : 0
  return { total, submitted, pending, completed, totalWorkers, totalEquip, avgProgress }
})

const showEditor = ref(false)
const editingReport = ref(null)
const isNewReport = ref(false)

function canEdit(report) {
  if (currentRole.value === ROLES.MANAGER) return false
  if (report.process !== myProcess.value) return false
  if (report.status === '승인 완료') return false
  return true
}

// =========================================================
// feat : 작성/수정 모달 오픈 및 데이터 연동 핵심 로직 (진척률 누적 버그 완벽 픽스)
// =========================================================
async function openEditor(report) {
  let fetchedPrevProgress = 0;

  // 이전 누적 진척률 자동 조회 (최대 3일 전까지 탐색하여 주말/휴일 커버)
  for (let i = 1; i <= 3; i++) {
    try {
      const pDate = addDays(report.date, -i);
      const pRes = await api.get('/report/', { params: { date: pDate } });
      const pArr = Array.isArray(pRes) ? pRes : (pRes.data?.data || pRes.data || []);
      const pTarget = pArr.find(r => r.tradeType === report.process || r.process === report.process);
      
      if (pTarget && pTarget.actualProgress) {
        fetchedPrevProgress = pTarget.actualProgress;
        break; // 이전 누적 진척률을 찾으면 즉시 탐색 종료
      }
    } catch (e) {
      console.warn(`${i}일 전 진척률 조회 실패, 이전 날짜 탐색 계속...`);
    }
  }

  if (report._placeholder) {
    isNewReport.value = true;
    editingReport.value = {
      id: `r_${Date.now()}`, date: report.date, process: report.process,
      author: '나(담당자)', location: '', workers: 0, equipmentCount: 0,
      equipmentList: [], equipmentInput: { name: '', count: 1 }, 
      tomorrowWorkers: 0, tomorrowEquipmentList: [], tomorrowEquipmentInput: { name: '', count: 1 },
      todayWork: '', tomorrowPlan: '', startDate: '', endDate: '',
      
      // 누적값을 넣어줍니다.
      prevProgress: fetchedPrevProgress, 
      progress: 0, 
      processProgress: fetchedPrevProgress, // 모달 열었을 때 시작점도 이전 누적값으로 세팅
      
      completion: '미완료', notes: '', photos: [], files: [], status: '작성 전', submittedAt: null,
      workPlanId: null,
    };
  } else {
    isNewReport.value = false;
    editingReport.value = {
      ...report, 
      workPlanId: report.workPlanId,
      equipmentList: [...(report.equipmentList || [])],
      equipmentInput: { name: '', count: 1 },
      tomorrowWorkers: 0, tomorrowEquipmentList: [], tomorrowEquipmentInput: { name: '', count: 1 },
      
      // 실제 DB에서 찾아온 이전 누적값 대입
      prevProgress: fetchedPrevProgress, 
      progress: report.progress || 0, 
      processProgress: report.processProgress || 0,
      
      photos: (report.photos || []).map(p => ({ ...p })),
      files: (report.files || []).map(f => ({ ...f }))
    };
  }

  try {
    const toDateString = (dateVal) => {
      if (!dateVal) return '';
      if (Array.isArray(dateVal)) return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`;
      return dateVal;
    };

    let targetPlan = null;

    if (!isNewReport.value && editingReport.value.workPlanId) {
        try {
            const pRes = await api.get(`/work-plan/${editingReport.value.workPlanId}`);
            targetPlan = pRes.data?.data || pRes.data;
        } catch (e) {
            console.error("기존 주간계획 호출 실패:", e);
        }
    }

    if (!targetPlan) {
        const [weekRes, monthRes, yearRes] = await Promise.all([
          api.get('/work-plan', { params: { planType: '주간' } }).catch(() => ({ data: [] })),
          api.get('/work-plan', { params: { planType: '월간' } }).catch(() => ({ data: [] })),
          api.get('/work-plan', { params: { planType: '연간' } }).catch(() => ({ data: [] }))
        ]);

        const allPlans = [
          ...(Array.isArray(weekRes) ? weekRes : (weekRes.data?.data || weekRes.data || [])),
          ...(Array.isArray(monthRes) ? monthRes : (monthRes.data?.data || monthRes.data || [])),
          ...(Array.isArray(yearRes) ? yearRes : (yearRes.data?.data || yearRes.data || []))
        ];

        const tradePlans = allPlans.filter(p => {
          const isSameTrade = (p.trade === report.process || p.tradeType === report.process);
          const isNotDummyHack = !(p.name || '').includes('(명일 예정)'); 
          return isSameTrade && isNotDummyHack && p.startDate && p.endDate;
        });

        if (tradePlans.length > 0) {
          let minStart = toDateString(tradePlans[0].startDate);
          let maxEnd = toDateString(tradePlans[0].endDate);
          let targetWorkPlanId = tradePlans[0].idx || tradePlans[0].id;

          tradePlans.forEach(p => {
            const startStr = toDateString(p.startDate);
            const endStr = toDateString(p.endDate);
            if (startStr < minStart) minStart = startStr;
            if (endStr > maxEnd) { maxEnd = endStr; targetWorkPlanId = p.idx || p.id; }
          });

          editingReport.value.startDate = minStart;
          editingReport.value.endDate = maxEnd;
          editingReport.value.workPlanId = targetWorkPlanId;

          const coveringPlan = tradePlans.find(p => report.date >= toDateString(p.startDate) && report.date <= toDateString(p.endDate));
          if (coveringPlan && !editingReport.value.location) {
             editingReport.value.location = coveringPlan.location || '';
          }
        }
    }

    // feat : 신규 작성 시 작업지시서(WorkOrder) 데이터 병합 로직
    if (isNewReport.value) {
      const orderRes = await api.get('/work-order').catch(() => ({ data: [] }));
      const orders = Array.isArray(orderRes) ? orderRes : (orderRes.data?.data || orderRes.data || []);
      const targetOrder = orders.find(o => (o.tradeType === report.process || o.trade === report.process) && toDateString(o.dueDate) === report.date);

      if (targetOrder) {
        if (confirm(`오늘(${report.date}) 작성된 [${report.process}] 관련 지시서가 있습니다! 데이터를 불러올까요?`)) {
          
          // 🔥 핵심 버그 수정: 지시서에 명확한 '작업 위치'가 있고 '-'가 아니면, 계획표의 빈 위치를 무시하고 무조건 덮어씀!
          if (targetOrder.location && targetOrder.location !== '-') {
             editingReport.value.location = targetOrder.location;
          }

          editingReport.value.workers = targetOrder.workerCount || 0;
          editingReport.value.todayWork = `[지시내용]\n${targetOrder.instructionContent || ''}\n\n[실제 완료]\n`;
          
          const eqList = [];
          let eqCount = 0;
          if (targetOrder.equipments && targetOrder.equipments.length > 0) {
            targetOrder.equipments.forEach(eq => {
              // 🔥 핵심 버그 수정: Enum 영문명을 한국어 장비명으로 번역!
              const korName = getEqKorName(eq.equipmentName || eq.type);
              const cnt = eq.equipmentCount || eq.count || 1;
              eqList.push(`${korName} ${cnt}대`);
              eqCount += cnt;
            });
          }
          
          // 🔥 중복 장비 제거 필터링 추가
          editingReport.value.equipmentList = [...new Set(eqList)];
          editingReport.value.equipmentCount = eqCount;
        }
      }
    }
  } catch (error) {
    console.error("계획 연동 실패:", error);
  }

  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false
  editingReport.value = null
  modalTab.value = 'today'
}

// feat : 공정 기간 비례 금일 증가분(%) 자동 계산 로직
const calcInfo = computed(() => {
  const r = editingReport.value
  if (!r || !r.startDate || !r.endDate) return null
  const start = new Date(r.startDate)
  const end = new Date(r.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  
  const duration = Math.max(1, Math.round((end - start) / 86400000) + 1)
  const dailyAllocation = 100 / duration 
  const increment = ((r.progress || 0) / 100) * dailyAllocation 
  
  return {
    duration,
    dailyAllocation: parseFloat(dailyAllocation.toFixed(2)),
    increment: parseFloat(increment.toFixed(2)),
  }
})

watch(
  () => [
    editingReport.value?.progress,
    editingReport.value?.startDate,
    editingReport.value?.endDate,
    editingReport.value?.prevProgress,
  ],
  () => {
    const r = editingReport.value
    if (!r) return
    const info = calcInfo.value
    if (!info) {
      r.processProgress = r.prevProgress || 0
      return
    }
    r.processProgress = parseFloat(
      Math.min(100, (r.prevProgress || 0) + info.increment).toFixed(1)
    )
  },
  { deep: true }
)

function addEquipment() {
  const v = (editingReport.value.equipmentInput.name || '').trim()
  if (!v) return
  const count = Math.max(1, editingReport.value.equipmentInput.count || 1)
  editingReport.value.equipmentList.push(v + ' ' + count + '대')
  editingReport.value.equipmentInput = { name: '', count: 1 }
}

function removeEquipment(idx) {
  editingReport.value.equipmentList.splice(idx, 1)
}

function addTomorrowEquipment() {
  const v = (editingReport.value.tomorrowEquipmentInput.name || '').trim()
  if (!v) return
  const count = Math.max(1, editingReport.value.tomorrowEquipmentInput.count || 1)
  editingReport.value.tomorrowEquipmentList.push(v + ' ' + count + '대')
  editingReport.value.tomorrowEquipmentInput = { name: '', count: 1 }
}

function removeTomorrowEquipment(idx) {
  editingReport.value.tomorrowEquipmentList.splice(idx, 1)
}

const photoInputRef = ref(null)
const fileInputRef = ref(null)

function pickPhotos() { photoInputRef.value?.click() }
function pickFiles()  { fileInputRef.value?.click() }

function onPhotoChange(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => {
    if (!f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      editingReport.value.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        name: f.name, size: f.size, dataUrl: ev.target.result,
      })
    }
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}

function onFileChangeInput(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => {
    editingReport.value.files.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name: f.name, size: f.size, type: f.type,
    })
  })
  e.target.value = ''
}

function removePhoto(idx) { editingReport.value.photos.splice(idx, 1) }
function removeFile(idx)  { editingReport.value.files.splice(idx, 1) }
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}
function fileBadge(type) {
  if (!type) return '파일'
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('sheet') || type.includes('excel')) return 'XLSX'
  if (type.includes('image')) return 'IMG'
  return '파일'
}

function saveDraft() {
  persistEditing('임시 저장')
  closeEditor()
}

async function submitReport() {
  const r = editingReport.value
  
  if (!r.location.trim()) { alert('작업 위치는 필수입니다.'); return; }
  if (!r.todayWork.trim()) { alert('금일 작업 완료 내용은 필수입니다.'); return; }
  if (!r.tomorrowPlan.trim()) { alert('명일 작업 예정은 필수입니다.'); return; }

  if (!r.workPlanId) {
    alert(`DB에 [${r.process}] 공정의 전체 계획을 찾지 못해 보고서를 제출할 수 없습니다 ㅠㅠ (공정 기간이 세팅되었는지 확인해주세요)`);
    return;
  }

  try {
    const payload = {
      workPlanId: r.workPlanId,                           
      todayProgress: parseFloat(r.progress || 0),         
      actualProgress: parseFloat(r.processProgress || 0), 
      actualWorkerCount: r.workers || 0,                  
      issue: r.notes || '특이사항 없음',                  
      reportDate: r.date,                                 
      todayWork: r.todayWork,                             
      tomorrowPlan: r.tomorrowPlan,                       
      
      tomorrowWorkerCount: r.tomorrowWorkers || 0,
      tomorrowEquipments: r.tomorrowEquipmentList.map(eqStr => {
         // 한글 장비명을 역으로 영문 Enum으로 바꾸는 과정은 서버 로직에 맞춰 필요 시 추가
         // 현재 백엔드에서는 라벨명 매칭을 처리하도록 되어있으므로 텍스트 그대로 전송
         const match = eqStr.match(/(.+)\s+(\d+)대/);
         if (match) {
             return { type: match[1].trim(), count: parseInt(match[2], 10) };
         }
         return { type: '기타', count: 1 };
      })
    };

    await api.post('/report/', payload);

    r.submittedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    persistEditing('제출 완료')
    closeEditor()

    alert('🎉 공사일보 제출 및 내일 작업계획(WorkPlan) 업데이트가 완료되었습니다!');
    
    loadReportsForDate(selectedDate.value);

  } catch (error) {
    console.error(error);
    alert('공사일보 제출에 실패했습니다. (콘솔 로그를 확인해 주세요)');
  }
}

function persistEditing(newStatus) {
  const r = editingReport.value
  delete r.equipmentInput
  delete r.tomorrowEquipmentInput
  r.status = newStatus

  const idx = reports.value.findIndex(x => x.id === r.id)
  if (idx >= 0) reports.value.splice(idx, 1, { ...r })
  else reports.value.push({ ...r })
}

const viewingReport = ref(null)

function openViewer(report) {
  if (report._placeholder) return
  viewingReport.value = report
}

function closeViewer() { viewingReport.value = null }

function approveReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex(r => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '승인 완료'
    viewingReport.value = reports.value[idx]
  }
}

function rejectReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex(r => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '반려'
    viewingReport.value = reports.value[idx]
  }
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showEditor.value) closeEditor()
  else if (viewingReport.value) closeViewer()
}

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">

    <!-- ========== 헤더 ========== -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">현장 보고</p>
        <h1 class="text-xl font-bold text-forena-900">공사일보</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.WORKER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="currentRole = ROLES.WORKER; activeTab = 'today'">
            <UserCog class="h-3.5 w-3.5" /> 공정 담당자
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.MANAGER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="currentRole = ROLES.MANAGER">
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 책임자
          </button>
        </div>

        <select v-if="currentRole === ROLES.WORKER" v-model="myProcess"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공정</option>
        </select>
      </div>
    </div>

    <!-- ========== 권한 안내 배너 ========== -->
    <div v-if="currentRole === ROLES.WORKER"
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-flare-200 bg-flare-50/60 px-4 py-3">
      <UserCog class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-flare-700">{{ myProcess }} 공정 담당자</span>입니다.
        담당 공정의 공사일보만 조회 · 작성 · 수정할 수 있습니다.
      </p>
    </div>
    <div v-else
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-emerald-700">현장 총 책임자</span>입니다.
        전체 공정의 공사일보를 조회하고 종합 공사일보로 취합해 볼 수 있습니다.
      </p>
    </div>

    <!-- ========== 날짜 / 액션 바 ========== -->
    <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3">
      <div class="flex items-center gap-1.5">
        <CalendarDays class="h-4 w-4 text-flare-600" />
        <span class="text-[11px] font-bold uppercase tracking-wide text-forena-500">조회 일자</span>
      </div>

      <div class="flex items-center gap-1">
        <button @click="prevDay" class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50">
          <ChevronLeft class="h-3.5 w-3.5" />
        </button>
        <input type="date" v-model="selectedDate" class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-forena-800 outline-none focus:border-flare-400" />
        <button @click="nextDay" class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50">
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
        <button @click="goToday" class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition" :class="isToday ? 'border-flare-200 bg-flare-50 text-flare-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'" :disabled="isToday">오늘</button>
      </div>

      <span class="text-xs font-semibold text-forena-700 tabular-nums">{{ fmtKor(selectedDate) }}</span>

      <div class="ml-auto flex items-center gap-2">
        <span v-if="currentRole === ROLES.MANAGER && stats.pending > 0" class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
          <AlertTriangle class="h-3 w-3" />미제출 {{ stats.pending }}건
        </span>
        <button v-if="currentRole === ROLES.WORKER" @click="openEditor(reportsForDate(selectedDate)[0])" class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
          <Plus class="h-3.5 w-3.5" />{{ reportsForDate(selectedDate)[0]?._placeholder ? '공사일보 작성' : '공사일보 수정' }}
        </button>
      </div>
    </div>

    <!-- ========== 통계 및 탭 바 ========== -->
    <div v-if="currentRole === ROLES.MANAGER" class="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">전체 공정</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-600">제출 완료</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{{ stats.submitted }}</p>
      </div>
      <div class="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">미제출</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-rose-700">{{ stats.pending }}</p>
      </div>
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"><Users class="h-3 w-3" /> 총 투입 인력</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.totalWorkers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span></p>
      </div>
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"><Wrench class="h-3 w-3" /> 총 투입 장비</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.totalEquip }}<span class="text-sm font-normal text-slate-400 ml-1">대</span></p>
      </div>
      <div class="rounded-xl border border-flare-100 bg-flare-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-flare-600">평균 진척률</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-flare-700">{{ stats.avgProgress }}<span class="text-sm font-normal ml-0.5">%</span></p>
      </div>
    </div>

    <!-- feat : 메인 화면 탭 내비게이션 -->
    <div class="flex shrink-0 items-center gap-1 border-b border-forena-100 mt-2">
      <button class="border-b-2 px-4 py-2 text-xs font-bold transition" :class="activeTab === 'today' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'" @click="switchTab('today')">금일 공사일보</button>
      <button class="border-b-2 px-4 py-2 text-xs font-bold transition" :class="activeTab === 'tomorrow' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'" @click="switchTab('tomorrow')">명일 작업 예정</button>
      <button v-if="currentRole === ROLES.MANAGER" class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold transition" :class="activeTab === 'consolidated' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'" @click="switchTab('consolidated')"><Layers class="h-3.5 w-3.5" /> 종합 공사일보</button>
    </div>

    <!-- ========== 본문 ========== -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      
      <!-- ============ 금일 공사일보 탭 영역 ============ -->
      <div v-if="activeTab === 'today'" class="grid grid-cols-1 gap-3 lg:grid-cols-2 mt-2">
        <div v-for="r in todayReports" :key="r.id" class="flex flex-col rounded-xl border bg-white transition" :class="r._placeholder ? 'border-dashed border-forena-200' : 'border-forena-100 hover:border-flare-200 hover:shadow-sm'">
          
          <div class="flex items-start justify-between gap-3 border-b border-forena-100 px-4 py-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700">{{ r.process }} 공정</span>
                <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1" :class="statusMeta(r.status).cls"><component :is="statusMeta(r.status).icon" class="h-3 w-3" /> {{ r.status }}</span>
              </div>
              <p class="mt-1.5 truncate text-sm font-bold text-forena-900">{{ r.location || '작업 위치 미입력' }}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button v-if="!r._placeholder" @click="openViewer(r)" class="rounded-md border border-forena-200 bg-white p-1.5 text-forena-600 hover:bg-forena-50" title="상세 보기"><Eye class="h-3.5 w-3.5" /></button>
              <button v-if="canEdit(r)" @click="openEditor(r)" class="rounded-md border border-flare-200 bg-flare-50 p-1.5 text-flare-700 hover:bg-flare-100" title="수정"><Pencil class="h-3.5 w-3.5" /></button>
              <button v-if="r._placeholder && currentRole === ROLES.WORKER && r.process === myProcess" @click="openEditor(r)" class="inline-flex items-center gap-1 rounded-md bg-flare-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-flare-600"><Plus class="h-3 w-3" /> 작성</button>
            </div>
          </div>
          
          <div v-if="!r._placeholder" class="flex-1 px-4 py-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2"><p class="flex items-center gap-1 text-[10px] font-bold text-forena-400"><Users class="h-3 w-3" /> 인력</p><p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">{{ r.workers }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">명</span></p></div>
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2"><p class="flex items-center gap-1 text-[10px] font-bold text-forena-400"><Wrench class="h-3 w-3" /> 장비</p><p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">{{ r.equipmentCount }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">대</span></p></div>
              
              <div class="rounded-lg bg-flare-50/60 px-2.5 py-1.5 flex flex-col justify-center">
                <p class="flex items-center justify-between text-[10px] font-bold text-flare-600">
                  전체 진척률
                  <span class="rounded bg-white px-1 py-0.5 text-[9px] font-bold text-flare-600 shadow-sm border border-flare-100">금일 {{ r.progress }}%</span>
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-flare-700">{{ r.processProgress }}<span class="text-[10px] font-normal ml-0.5">%</span></p>
              </div>
            </div>
            
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
              <div class="h-full rounded-full bg-flare-500 transition-all" :style="{ width: r.processProgress + '%' }"></div>
            </div>

            <div class="mt-3"><p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 작업 완료</p><p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.todayWork || '—' }}</p></div>
          </div>
          <div v-else class="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-8 text-center"><FileText class="h-6 w-6 text-slate-300" /><p class="text-xs text-slate-400">{{ r.process }} 공정 공사일보가 아직 작성되지 않았습니다.</p></div>
        </div>
      </div>
      
      <!-- ============ 명일 작업 예정 탭 영역 ============ -->
      <div v-else-if="activeTab === 'tomorrow'" class="space-y-3 mt-2">
        <p class="text-xs text-forena-500"><span class="font-bold tabular-nums text-forena-700">{{ fmtKor(tomorrowDate) }}</span> 기준 공정별 작업 예정 내용입니다.</p>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div v-for="r in todayReports" :key="'tomorrow_' + r.id" class="rounded-xl border border-forena-100 bg-white p-4">
            <div class="flex items-center gap-1.5"><span class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700">{{ r.process }} 공정</span></div>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-wide text-forena-400">명일 작업 예정</p>
            <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.tomorrowPlan || '—' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- =====================================================
         작성/수정 모달 (에디터 영역)
         ===================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="showEditor && editingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeEditor">
        <div class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">
                  {{ isNewReport ? '공사일보 작성' : '공사일보 수정' }}
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-bold text-forena-700">{{ editingReport.process }} 공정</span>
                  · {{ fmtKor(editingReport.date) }} · 작성자 {{ editingReport.author }}
                </p>
              </div>
            </div>
            <button @click="closeEditor" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex shrink-0 items-center gap-1 border-b border-forena-100 bg-forena-50/30 px-6">
            <button class="border-b-2 px-3 py-2.5 text-xs font-bold transition" :class="modalTab === 'today' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'" @click="modalTab = 'today'">금일 공사 내용</button>
            <button class="border-b-2 px-3 py-2.5 text-xs font-bold transition" :class="modalTab === 'tomorrow' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'" @click="modalTab = 'tomorrow'">명일 작업 예정</button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            
            <div v-if="modalTab === 'today'" class="space-y-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div class="sm:col-span-3">
                  <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"><MapPin class="mr-0.5 inline h-3 w-3" />작업 위치 <span class="text-rose-500">*</span></label>
                  <input v-model="editingReport.location" class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"><Users class="mr-0.5 inline h-3 w-3" />금일 작업 인력 수</label>
                  <input type="number" min="0" v-model.number="editingReport.workers" class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">완료 / 미완료</label>
                  <select v-model="editingReport.completion" class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"><option>미완료</option><option>완료</option></select>
                </div>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">금일 투입 장비 목록</label>
                <div class="flex gap-2">
                  <select v-model="editingReport.equipmentInput.name" class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">장비 선택</option><optgroup v-for="(items, category) in equipmentList" :key="category" :label="category"><option v-for="equipment in items" :key="`${category}_${equipment}`" :value="equipment">{{ equipment }}</option></optgroup></select>
                  <input type="number" min="1" v-model.number="editingReport.equipmentInput.count" class="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm text-center tabular-nums" />
                  <button @click="addEquipment" class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-xs font-bold text-flare-700 hover:bg-flare-100"><Plus class="h-3 w-3" />추가</button>
                </div>
                <div v-if="editingReport.equipmentList.length" class="mt-2 flex flex-wrap gap-1.5">
                  <span v-for="(eq, i) in editingReport.equipmentList" :key="i" class="inline-flex items-center gap-1 rounded-md bg-forena-50 px-2 py-0.5 text-[11px] font-semibold text-forena-700">{{ eq }}<button @click="removeEquipment(i)" class="text-slate-400 hover:text-rose-600"><X class="h-3 w-3" /></button></span>
                </div>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">금일 작업 완료 내용 <span class="text-rose-500">*</span></label>
                <textarea v-model="editingReport.todayWork" rows="4" class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">공정 기간</label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="mb-0.5 block text-[10px] text-forena-400">시작일</label>
                    <input type="date" v-model="editingReport.startDate"
                      class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div>
                    <label class="mb-0.5 block text-[10px] text-forena-400">종료일</label>
                    <input type="date" v-model="editingReport.endDate"
                      class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                </div>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">이전 누적 진척률 (%)</label>
                <input type="number" min="0" max="100" v-model.number="editingReport.prevProgress" class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500">금일 진척률</label>
                  <span class="text-xs font-bold tabular-nums text-flare-700">{{ editingReport.progress }}%</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <input type="range" min="0" max="100" step="1" v-model.number="editingReport.progress" class="w-full accent-flare-500" />
                    <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
                      <div class="h-full rounded-full bg-flare-500 transition-all" :style="{ width: editingReport.progress + '%' }"></div>
                    </div>
                  </div>
                  <input type="number" min="0" max="100" v-model.number="editingReport.progress" class="w-20 rounded-md border border-forena-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
                <p v-if="calcInfo" class="mt-1 text-[10px] text-forena-400">
                  금일 증가분: <span class="font-semibold text-forena-700">{{ calcInfo.increment }}%</span>
                  (기간 {{ calcInfo.duration }}일 · 일일 배분율 {{ calcInfo.dailyAllocation }}%)
                </p>
              </div>

              <div class="rounded-lg border border-flare-100 bg-flare-50/40 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-flare-600">
                    공정 전체 진척률
                    <span class="font-normal text-flare-400">(공기 비례 자동 계산)</span>
                  </label>
                  <span class="text-sm font-bold tabular-nums text-flare-700">{{ editingReport.processProgress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-flare-100">
                  <div class="h-full rounded-full bg-flare-500 transition-all" :style="{ width: editingReport.processProgress + '%' }"></div>
                </div>
                <p v-if="calcInfo" class="mt-1.5 text-[10px] text-forena-500">
                  이전 누적 <span class="font-bold text-forena-700">{{ editingReport.prevProgress }}%</span>
                  + 금일 증가분 <span class="font-bold text-forena-700">{{ calcInfo.increment }}%</span>
                  = <span class="font-bold text-flare-700">{{ editingReport.processProgress }}%</span>
                </p>
                <p v-else class="mt-1.5 text-[10px] text-amber-600">
                  ⚠ 공정 기간(시작일·종료일)을 입력하면 자동 계산됩니다.
                </p>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">특이사항</label>
                <textarea v-model="editingReport.notes" rows="2" class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>
            </div>

            <div v-else-if="modalTab === 'tomorrow'" class="space-y-4 mt-2">
              <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                <p class="text-xs font-bold text-amber-900">
                  🔥 아래에 명일 투입 인력과 장비를 설정하시면 내일짜 스케줄(WorkPlan) 원본에 자동으로 업데이트됩니다.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"><Users class="mr-0.5 inline h-3 w-3" />명일 투입 예정 인력</label>
                  <input type="number" min="0" v-model.number="editingReport.tomorrowWorkers" class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
              </div>

              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">명일 투입 예정 장비</label>
                <div class="flex gap-2">
                  <select v-model="editingReport.tomorrowEquipmentInput.name" class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">장비 선택</option><optgroup v-for="(items, category) in equipmentList" :key="category" :label="category"><option v-for="equipment in items" :key="`${category}_${equipment}`" :value="equipment">{{ equipment }}</option></optgroup></select>
                  <input type="number" min="1" v-model.number="editingReport.tomorrowEquipmentInput.count" class="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm text-center tabular-nums" />
                  <button @click="addTomorrowEquipment" class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-xs font-bold text-flare-700 hover:bg-flare-100"><Plus class="h-3 w-3" />추가</button>
                </div>
                <div v-if="editingReport.tomorrowEquipmentList.length" class="mt-2 flex flex-wrap gap-1.5">
                  <span v-for="(eq, i) in editingReport.tomorrowEquipmentList" :key="i" class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">{{ eq }}<button @click="removeTomorrowEquipment(i)" class="text-slate-400 hover:text-rose-600"><X class="h-3 w-3" /></button></span>
                </div>
              </div>

              <div class="mt-4">
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">명일 작업 예정 내용 <span class="text-rose-500">*</span></label>
                <textarea v-model="editingReport.tomorrowPlan" rows="6" class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>
            </div>
          </div>

          <div class="flex shrink-0 items-center justify-between gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <p class="text-[11px] text-forena-500"><span class="text-rose-500">*</span> 표시는 필수 입력 항목입니다.</p>
            <div class="flex gap-2">
              <button @click="closeEditor" class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">취소</button>
              <button @click="saveDraft" class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"><Save class="h-3.5 w-3.5" /> 임시 저장</button>
              <button @click="submitReport" class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600"><Send class="h-3.5 w-3.5" /> 제출 (내일 스케줄 업데이트)</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- =====================================================
         조회 모달 (상세보기)
         ===================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="viewingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeViewer">
        <div class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forena-50">
                <FileText class="h-5 w-5 text-forena-700" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">{{ viewingReport.process }} 공정 공사일보</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  {{ fmtKor(viewingReport.date) }} · 작성자 {{ viewingReport.author }}
                  <span v-if="viewingReport.submittedAt"> · 제출 {{ viewingReport.submittedAt }}</span>
                </p>
              </div>
            </div>
            <button @click="closeViewer" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <MapPin class="h-3 w-3" />작업 위치
                </p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ viewingReport.location }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <Users class="h-3 w-3" />작업 인력
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.workers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <Wrench class="h-3 w-3" />중장비
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.equipmentCount }}<span class="text-sm font-normal text-slate-400 ml-1">대</span>
                </p>
                <div v-if="viewingReport.equipmentList.length" class="mt-1.5 flex flex-wrap gap-1">
                  <span v-for="(eq, i) in viewingReport.equipmentList" :key="i"
                    class="inline-flex items-center rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-semibold text-forena-700">
                    {{ eq }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-forena-100 p-3.5">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 진척률</p>
                  <span class="text-xs font-bold tabular-nums text-flare-700">{{ viewingReport.progress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-forena-100">
                  <div class="h-full rounded-full bg-flare-500" :style="{ width: viewingReport.progress + '%' }"></div>
                </div>
              </div>
              <div class="rounded-xl border border-forena-100 p-3.5">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">공정 전체 진척률</p>
                  <span class="text-xs font-bold tabular-nums text-flare-700">{{ viewingReport.processProgress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-forena-100">
                  <div class="h-full rounded-full bg-flare-500" :style="{ width: viewingReport.processProgress + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 작업 완료</p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewingReport.todayWork }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">명일 작업 예정</p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewingReport.tomorrowPlan }}</p>
              </div>
            </div>

            <div v-if="viewingReport.notes" class="mt-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ viewingReport.notes }}</p>
            </div>
          </div>

          <div v-if="currentRole === ROLES.MANAGER"
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <button @click="rejectReport"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
              <AlertTriangle class="h-3.5 w-3.5" /> 반려
            </button>
            <button @click="approveReport"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600">
              <CheckCircle2 class="h-3.5 w-3.5" /> 승인
            </button>
            <button @click="closeViewer"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
              닫기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>