/** 예시 작업자 상세 프로필 (작업자 관리 / 출입근태 연동) */

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
      },
      {
        title: '신분증 사본 및 통장 사본',
        status: '완료',
        statusVariant: 'done',
      },
    ],
    attendanceRows: [
      {
        date: '2025-10-14',
        clockIn: '06:50',
        clockOut: '17:10',
        manDays: 1.0,
        site: '강남 A공구',
      },
      {
        date: '2025-10-13',
        clockIn: '06:48',
        clockOut: '17:05',
        manDays: 1.0,
        site: '강남 A공구',
      },
      {
        date: '2025-10-12',
        clockIn: '06:52',
        clockOut: '17:00',
        manDays: 1.0,
        site: '강남 A공구',
      },
    ],
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
      },
      {
        title: '개인정보동의 서약',
        status: '제출 대기',
        statusVariant: 'pending',
      },
    ],
    attendanceRows: [
      {
        date: '2025-10-14',
        clockIn: '07:05',
        clockOut: '-',
        manDays: 0,
        site: '강남 A공구',
      },
      {
        date: '2025-10-13',
        clockIn: '07:00',
        clockOut: '17:15',
        manDays: 1.0,
        site: '강남 A공구',
      },
    ],
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
      },
    ],
    attendanceRows: [
      {
        date: '2025-10-14',
        clockIn: '06:45',
        clockOut: '16:00',
        manDays: 0.5,
        site: '판교 DC',
      },
      { date: '2025-10-13', clockIn: '-', clockOut: '-', manDays: 0, site: '-' },
    ],
    zoneHistory: [{ date: '2025-09-01', zone: '업무동', note: '전사' }],
    sanctions: [
      { date: '2025-09-10', type: '제재', description: '무단속직 3일' },
    ],
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
      },
      {
        title: '신분증 사본',
        status: '완료',
        statusVariant: 'done',
      },
    ],
    attendanceRows: [
      {
        date: '2025-10-14',
        clockIn: '06:55',
        clockOut: '17:00',
        manDays: 1.0,
        site: '강남 A공구',
      },
    ],
    zoneHistory: [{ date: '2025-10-05', zone: '외부 비계', note: '일일' }],
    sanctions: [{ date: '2025-10-01', type: '주의', description: '투입 제한 상태' }],
  },
}

export function getWorkerProfile(id) {
  const n = Number(id)
  return workerProfilesById[n] || null
}
