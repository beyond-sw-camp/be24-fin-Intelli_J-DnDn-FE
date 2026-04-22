/** 예시 작업자 상세 프로필 (작업자 관리 / 출입근태 연동) */

/** 데모용 PDF (미리보기·다운로드) */
export const DEMO_WORKER_DOCUMENT_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

/** 공통: 1.0공수 근무일 */
function dayFull(date, zone, site = '강남 A공구', clockIn = '06:50', clockOut = '17:10') {
  return { date, zone, clockIn, clockOut, manDays: 1.0, site }
}

function dayHalf(date, zone, site = '강남 A공구') {
  return { date, zone, clockIn: '06:50', clockOut: '12:30', manDays: 0.5, site }
}

function dayNone(date, zone, site = '-') {
  return { date, zone, clockIn: '-', clockOut: '-', manDays: 0, site }
}

/** 워커1: 당월 누적 18.5 = 17일×1.0 + 3일×0.5 (2025-10) */
const w1Rows = [
  dayFull('2025-10-31', 'A구역 (지하주차장)'),
  dayFull('2025-10-30', 'A구역 (지하주차장)'),
  dayFull('2025-10-29', 'A구역 (지하주차장)'),
  dayFull('2025-10-28', 'A구역 (지하주차장)'),
  dayFull('2025-10-27', 'A구역 (지하주차장)'),
  dayHalf('2025-10-24', 'A구역 (지하주차장)'),
  dayFull('2025-10-23', 'A구역 (지하주차장)'),
  dayFull('2025-10-21', 'A구역 (지하주차장)'),
  dayFull('2025-10-20', 'A구역 (지하주차장)'),
  dayHalf('2025-10-17', 'A구역 (지하주차장)'),
  dayFull('2025-10-16', 'A구역 (지하주차장)'),
  dayFull('2025-10-14', 'A구역 (지하주차장)'),
  dayFull('2025-10-13', 'A구역 (지하주차장)'),
  dayHalf('2025-10-10', 'A구역 (지하주차장)'),
  dayFull('2025-10-09', 'A구역 (지하주차장)'),
  dayFull('2025-10-07', 'A구역 (지하주차장)'),
  dayFull('2025-10-06', 'A구역 (지하주차장)'),
  dayFull('2025-10-03', 'A구역 (지하주차장)'),
  dayFull('2025-10-02', 'A구역 (지하주차장)'),
  dayFull('2025-10-01', 'A구역 (지하주차장)'),
]

/** 워커2: 당월 누적 14.0 = 14일×1.0 */
const w2Rows = [
  dayFull('2025-10-31', 'C구역'),
  dayFull('2025-10-30', 'C구역'),
  dayFull('2025-10-29', 'C구역'),
  dayFull('2025-10-28', 'C구역'),
  dayFull('2025-10-27', 'C구역'),
  dayFull('2025-10-24', 'C구역'),
  dayFull('2025-10-23', 'C구역'),
  dayFull('2025-10-22', 'C구역'),
  dayFull('2025-10-21', 'C구역'),
  dayFull('2025-10-20', 'C구역'),
  dayFull('2025-10-17', 'C구역'),
  dayFull('2025-10-16', 'C구역'),
  dayFull('2025-10-15', 'C구역'),
  dayFull('2025-10-14', 'C구역', '강남 A공구', '07:05', '17:00'),
]

/** 워커3: 당월 누적 10.5 = 10×1.0 + 1×0.5 (판교) */
const w3Rows = [
  dayFull('2025-10-31', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-30', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-29', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-28', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-27', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-24', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-23', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-22', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-21', '업무동', '판교 DC', '06:45', '17:00'),
  dayFull('2025-10-20', '업무동', '판교 DC', '06:45', '17:00'),
  dayHalf('2025-10-14', '업무동', '판교 DC'),
  dayNone('2025-10-13', '업무동'),
]

/** 워커4: 당월 누적 12.0 = 12×1.0 */
const w4Rows = [
  dayFull('2025-10-31', '외부 비계'),
  dayFull('2025-10-30', '외부 비계'),
  dayFull('2025-10-29', '외부 비계'),
  dayFull('2025-10-28', '외부 비계'),
  dayFull('2025-10-27', '외부 비계'),
  dayFull('2025-10-24', '외부 비계'),
  dayFull('2025-10-23', '외부 비계'),
  dayFull('2025-10-22', '외부 비계'),
  dayFull('2025-10-21', '외부 비계'),
  dayFull('2025-10-20', '외부 비계'),
  dayFull('2025-10-17', '외부 비계'),
  dayFull('2025-10-16', '외부 비계'),
]

export const workerProfilesById = {
  1: {
    id: 1,
    name: '김동석',
    company: '태양건설',
    role: '정동목수',
    deployStatus: '투입 가능',
    deployStatusVariant: 'ok',
    phone: '010-1234-5678',
    emergency: '010-1111-1111',
    bloodType: 'A+',
    registeredAt: '2025.01.10',
    site: '강남구 재건축 A공구',
    monthTotalMan: 18.5,
    documents: [
      {
        title: '기초안전보건교육 이수증',
        status: '이수완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '기초안전보건교육_이수증.pdf',
      },
      {
        title: '신분증 사본 및 통장 사본',
        status: '완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '신분증_통장사본.pdf',
      },
    ],
    attendanceRows: w1Rows,
    zoneHistory: [
      {
        date: '2025-10-01',
        zone: 'A구역 (지하주차장)',
        note: '형틀 반',
      },
      { date: '2025-09-15', zone: 'B구역 (업무동)', note: '도원' },
    ],
    sanctions: [
      {
        date: '2025-08-20',
        type: '주의',
        description: '안전모 미착용 1회',
      },
    ],
  },
  2: {
    id: 2,
    name: '이목수',
    company: '인력사무소',
    role: '일용',
    deployStatus: '투입 검토',
    deployStatusVariant: 'warn',
    phone: '010-8888-7777',
    emergency: '010-7777-6666',
    bloodType: 'O+',
    registeredAt: '2025.03.02',
    site: '강남구 재건축 A공구',
    monthTotalMan: 14.0,
    documents: [
      {
        title: '기초안전보건교육 이수증',
        status: '이수완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '기초안전보건교육_이수증.pdf',
      },
      {
        title: '개인정보동의 서약',
        status: '제출 대기',
        statusVariant: 'pending',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '개인정보동의_서약.pdf',
      },
    ],
    attendanceRows: w2Rows,
    zoneHistory: [{ date: '2025-10-01', zone: 'C구역', note: '임시' }],
    sanctions: [],
  },
  3: {
    id: 3,
    name: '박반장',
    company: '본사',
    role: '현장 관리',
    deployStatus: '투입 제한',
    deployStatusVariant: 'block',
    phone: '010-5555-4444',
    emergency: '010-4444-3333',
    bloodType: 'B+',
    registeredAt: '2024.11.20',
    site: '판교 데이터센터',
    monthTotalMan: 10.5,
    documents: [
      {
        title: '기초안전보건교육 이수증',
        status: '이수완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '기초안전보건교육_이수증.pdf',
      },
    ],
    attendanceRows: w3Rows,
    zoneHistory: [{ date: '2025-09-01', zone: '업무동', note: '전사' }],
    sanctions: [{ date: '2025-09-10', type: '제재', description: '무단속직 3일' }],
  },
  4: {
    id: 4,
    name: '최용호',
    company: '태양건설',
    role: '비계공',
    deployStatus: '투입 제한',
    deployStatusVariant: 'block',
    phone: '010-1111-2222',
    emergency: '010-2222-3333',
    bloodType: 'AB+',
    registeredAt: '2025.02.01',
    site: '강남구 재건축 A공구',
    monthTotalMan: 12.0,
    documents: [
      {
        title: '기초안전보건교육 이수증',
        status: '이수완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '기초안전보건교육_이수증.pdf',
      },
      {
        title: '신분증 사본',
        status: '완료',
        statusVariant: 'done',
        fileUrl: DEMO_WORKER_DOCUMENT_PDF_URL,
        storedFileName: '신분증_사본.pdf',
      },
    ],
    attendanceRows: w4Rows,
    zoneHistory: [{ date: '2025-10-05', zone: '외부 비계', note: '일일' }],
    sanctions: [{ date: '2025-10-01', type: '주의', description: '투입 제한 상태' }],
  },
}

export function getWorkerProfile(id) {
  const n = Number(id)
  return workerProfilesById[n] || null
}
