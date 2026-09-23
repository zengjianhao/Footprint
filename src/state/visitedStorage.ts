import type { DetailCountryId } from '../geo/types'

const STORAGE_KEY = 'footprint.visited.v3'
/** v2 只记录精细地图单元：{ version: 2, units: {...} }，国家是从单元推导的 */
const LEGACY_V2_KEY = 'footprint.visited.v2'
/** v1 只记录中国的市：{ cities: string[] } */
const LEGACY_V1_KEY = 'footprint.visited.v1'

export type VisitedUnitArrays = Partial<Record<DetailCountryId, string[]>>

export interface VisitedArrays {
  /** 世界地图上标记的国家 key；旧版本没有这个概念，迁移时为 undefined，由调用方推导 */
  countries?: string[]
  /** 精细地图里标记的单元，按国家分组 */
  units: VisitedUnitArrays
}

interface VisitedRecord {
  version: 3
  countries: string[]
  units: VisitedUnitArrays
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isUnitArrays(value: unknown): value is VisitedUnitArrays {
  if (typeof value !== 'object' || value === null) return false
  return Object.values(value as Record<string, unknown>).every(isStringArray)
}

function isVisitedRecord(value: unknown): value is VisitedRecord {
  if (typeof value !== 'object' || value === null) return false
  const { version, countries, units } = value as {
    version?: unknown
    countries?: unknown
    units?: unknown
  }
  return version === 3 && isStringArray(countries) && isUnitArrays(units)
}

function loadLegacy(): VisitedArrays | undefined {
  const v2 = localStorage.getItem(LEGACY_V2_KEY)
  if (v2) {
    const parsed: unknown = JSON.parse(v2)
    const units = (parsed as { units?: unknown } | null)?.units
    if (isUnitArrays(units)) return { units }
  }
  const v1 = localStorage.getItem(LEGACY_V1_KEY)
  if (v1) {
    const parsed: unknown = JSON.parse(v1)
    const cities = (parsed as { cities?: unknown } | null)?.cities
    if (isStringArray(cities)) return { units: { china: cities } }
  }
  return undefined
}

/**
 * 从 localStorage 读取；存储不可用或数据损坏时返回空记录。
 * 旧版本记录会自动迁移，其中 countries 为 undefined，表示需要由已去过的单元推导出来。
 */
export function loadVisited(): VisitedArrays {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isVisitedRecord(parsed)) return { countries: parsed.countries, units: parsed.units }
    }
    return loadLegacy() ?? { units: {} }
  } catch {
    return { units: {} }
  }
}

export function saveVisited(visited: Required<VisitedArrays>): void {
  try {
    const record: VisitedRecord = { version: 3, ...visited }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // 隐私模式或存储已满：本次会话内仍可用，只是不持久
  }
}
