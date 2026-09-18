import type { DetailCountryId } from '../geo/types'

const STORAGE_KEY = 'footprint.visited.v2'
/** v1 只记录中国的市：{ cities: string[] } */
const LEGACY_KEY = 'footprint.visited.v1'

export type VisitedUnitArrays = Partial<Record<DetailCountryId, string[]>>

interface VisitedRecord {
  version: 2
  units: VisitedUnitArrays
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isVisitedRecord(value: unknown): value is VisitedRecord {
  if (typeof value !== 'object' || value === null) return false
  const { version, units } = value as { version?: unknown; units?: unknown }
  if (version !== 2 || typeof units !== 'object' || units === null) return false
  return Object.values(units as Record<string, unknown>).every(isStringArray)
}

function loadLegacy(): VisitedUnitArrays | undefined {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return undefined
  const parsed: unknown = JSON.parse(raw)
  const cities = (parsed as { cities?: unknown } | null)?.cities
  return isStringArray(cities) ? { china: cities } : undefined
}

/** 从 localStorage 读取；存储不可用或数据损坏时返回空记录。旧版记录会自动迁移 */
export function loadVisited(): VisitedUnitArrays {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isVisitedRecord(parsed)) return parsed.units
    }
    return loadLegacy() ?? {}
  } catch {
    return {}
  }
}

export function saveVisited(units: VisitedUnitArrays): void {
  try {
    const record: VisitedRecord = { version: 2, units }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // 隐私模式或存储已满：本次会话内仍可用，只是不持久
  }
}
