import api from './index.js'

const PATH = '/trade-process'

const toTradeProcessPlan = (dto) => ({
  id: `tp-${dto.idx}`,
  tradeProcessId: dto.idx,
  masterScheduleId: dto.masterScheduleId,
  projectId: dto.projectId,

  name: dto.processName,
  trade: dto.tradeName,
  partner: dto.partnerCompany || '',

  start: dto.plannedStart,
  end: dto.plannedEnd,

  weightPct: dto.weightPct ?? 0,
  isMilestone: dto.isMilestone ?? false,

  planType: '기준',
  status: '진행 예정',
  source: 'trade_process',
})

export const fetchTradeProcessList = async (params = {}) => {
  const dtos = await api.get(PATH, { params })
  return Array.isArray(dtos) ? dtos.map(toTradeProcessPlan) : []
}
