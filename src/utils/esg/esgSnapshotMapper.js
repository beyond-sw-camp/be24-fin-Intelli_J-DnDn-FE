import {
  ESG_SITE_FLOOR_POINT,
  ESG_ZONE_FLOOR_POINT,
  clampScore,
  normalizeCumulativeScore,
  normalizeList,
  resolveEsgFloor,
  roundOne,
} from './esgScoreCalculator.js'

function buildShortSiteName(name = '') {
  const cleaned = String(name || '').replace(/신축|재건축|공구|공사|현장/g, '').trim()
  return cleaned.split(/\s+/).slice(0, 2).join(' ') || String(name || '현장').trim()
}
export function parseProjectDisplayName(rawName = '') {
  const normalized = String(rawName || '').trim()
  const matched = normalized.match(/^\s*\[([^\]]+)]\s*(.*)$/)
  if (!matched) {
    return {
      siteCode: '',
      displayName: normalized || '현장명 미지정',
      shortName: buildShortSiteName(normalized || '현장'),
    }
  }

  const displayName = matched[2]?.trim() || normalized
  return {
    siteCode: matched[1]?.trim() || '',
    displayName,
    shortName: buildShortSiteName(displayName),
  }
}

export function buildProjectSiteItems(projects = [], rankings = [], currentProjectId = null, fallbackSite = null) {
  const rankingMap = new Map(
    normalizeList(rankings).map((item) => [String(item.projectId ?? item.idx ?? item.id), item]),
  )

  const projectItems = normalizeList(projects).map((project, index) => {
    const projectId = project.idx ?? project.projectId ?? project.id
    const ranking = rankingMap.get(String(projectId)) ?? {}
    const parsed = parseProjectDisplayName(project.name ?? ranking.projectName)
    const totalScore = Number(ranking.totalScore ?? ranking.score ?? 0)
    const hasSnapshot = Boolean(ranking.snapshotSaved ?? ranking.hasSnapshot ?? totalScore > 0)

    return {
      id: String(projectId),
      projectId,
      siteCode: parsed.siteCode,
      name: parsed.displayName,
      shortName: parsed.shortName,
      address: project.location ?? ranking.address ?? '',
      contractor: ranking.contractor ?? project.contractor ?? '',
      manager: ranking.manager ?? project.manager ?? '',
      score: normalizeCumulativeScore(totalScore),
      level: resolveEsgFloor(totalScore, ESG_SITE_FLOOR_POINT),
      carbon: Math.round(Number(ranking.carbonKg ?? ranking.carbon ?? 0)),
      powerSaving: Math.round(Number(ranking.powerSavingKwh ?? ranking.powerSaving ?? 0)),
      riskCount: Math.round(Number(ranking.riskCount ?? 0)),
      missionRate: Math.round(Number(ranking.missionRate ?? 0)),
      trend: Number(ranking.trend ?? 0),
      accent: ['emerald', 'sky', 'violet', 'amber'][index % 4],
      snapshotSaved: hasSnapshot,
      startDate: project.startDate ?? ranking.startDate ?? null,
      endDate: project.endDate ?? ranking.endDate ?? null,
    }
  })

  if (projectItems.length) return projectItems
  return fallbackSite ? [fallbackSite] : []
}

export function buildSnapshotPayload({ reportDate, currentSite, siteZones, esgBreakdown, safetyDays }) {
  const zones = normalizeList(siteZones)
  const scores = normalizeList(esgBreakdown)
  const scoreTargets = selectSiteScoreZones(zones)
  const targetCount = scoreTargets.length
  const averageBy = (selector) => {
    if (!targetCount) return 0
    const sum = scoreTargets.reduce((total, zone) => total + Number(selector(zone) || 0), 0)
    return clampScore(sum / targetCount)
  }

  const environmentScore = averageBy((zone) => zone.metrics?.environmentScore)
  const socialScore = averageBy((zone) => zone.metrics?.socialScore)
  const governanceScore = averageBy((zone) => zone.metrics?.governanceScore)
  const totalScore = targetCount
    ? clampScore(scoreTargets.reduce((sum, zone) => sum + Number(zone.dailyScore ?? zone.metrics?.totalScore ?? zone.score ?? 0), 0) / targetCount)
    : clampScore(currentSite?.dailyScore ?? currentSite?.score ?? 0)
  const contributionWeight = targetCount ? roundOne(100 / targetCount) : 0
  const scoreTargetIds = new Set(scoreTargets.map((zone) => zone.id))
  const zoneSnapshots = zones.map((zone) => {
    const contributesToSiteScore = scoreTargetIds.has(zone.id)
    const zoneScore = clampScore(zone.dailyScore ?? zone.metrics?.totalScore ?? zone.score ?? 0)

    return {
      zoneName: zone.name,
      zoneType: zone.zoneType ?? 'work',
      environmentScore: clampScore(zone.metrics?.environmentScore ?? 0),
      socialScore: clampScore(zone.metrics?.socialScore ?? 0),
      governanceScore: clampScore(zone.metrics?.governanceScore ?? 0),
      totalScore: zoneScore,
      level: resolveEsgFloor(zoneScore, ESG_ZONE_FLOOR_POINT),
      carbonKg: Math.round(Number(zone.carbon || zone.metrics?.estimatedCarbonKg || 0)),
      powerSavingKwh: Math.round(Number(zone.powerSaving || zone.metrics?.powerSavingKwh || 0)),
      riskCount: Math.round(Number(zone.risk || zone.metrics?.operatingRisk || 0)),
      missionRate: Math.round(Number(zone.missionRate || zone.metrics?.missionRate || 0)),
      equipmentCount: Math.round(Number(zone.equipmentCount || zone.metrics?.totalEquipmentCount || 0)),
      highRiskEquipmentCount: Math.round(Number(zone.highRiskEquipmentCount || zone.metrics?.highRiskEquipmentCount || 0)),
      contributionWeight: contributesToSiteScore ? contributionWeight : 0,
      contributionScore: contributesToSiteScore && targetCount ? clampScore(zoneScore / targetCount) : 0,
      snapshotJson: JSON.stringify({
        id: zone.id,
        name: zone.name,
        type: zone.type,
        zoneType: zone.zoneType,
        rank: zone.rank,
        status: zone.status,
        equipmentSummary: zone.equipmentSummary,
        gateSummary: zone.gateSummary,
        metrics: zone.metrics,
      }),
    }
  })

  return {
    projectId: currentSite?.projectId ?? Number(currentSite?.id),
    reportDate,
    totalScore,
    level: resolveEsgFloor(totalScore, ESG_SITE_FLOOR_POINT),
    environmentScore,
    socialScore,
    governanceScore,
    carbonKg: Math.round(zones.reduce((sum, zone) => sum + Number(zone.carbon || 0), 0)),
    powerSavingKwh: Math.round(zones.reduce((sum, zone) => sum + Number(zone.powerSaving || 0), 0)),
    riskCount: Math.round(zones.reduce((sum, zone) => sum + Number(zone.risk || 0), 0)),
    missionRate: scoreTargets.length
      ? Math.round(scoreTargets.reduce((sum, zone) => sum + Number(zone.missionRate || 0), 0) / scoreTargets.length)
      : Math.round(Number(currentSite?.missionRate || 0)),
    zoneCount: zones.length,
    safetyDays: Math.max(1, Math.round(Number(safetyDays || 1))),
    zones: zoneSnapshots,
    snapshotJson: JSON.stringify({
      site: currentSite,
      zones,
      scores,
      siteScore: {
        targetZoneIds: Array.from(scoreTargetIds),
        targetCount,
        contributionWeight,
        environmentScore,
        socialScore,
        governanceScore,
        totalScore,
      },
    }),
  }
}

function selectSiteScoreZones(zones) {
  return normalizeList(zones)
}

export function calculateSafetyDays(project, reportDate) {
  const startDateText = project?.startDate
  if (!startDateText) return 1

  const start = new Date(`${startDateText}T00:00:00`)
  const target = new Date(`${reportDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) return 1
  const diff = Math.floor((target.getTime() - start.getTime()) / 86400000) + 1
  return Math.max(1, diff)
}
