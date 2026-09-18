const STORAGE_KEY = 'footprint.visited.v1'

export interface VisitedRecord {
  /** 去过的市（行政区划代码） */
  cities: string[]
}

const EMPTY: VisitedRecord = { cities: [] }

function isVisitedRecord(value: unknown): value is VisitedRecord {
  if (typeof value !== 'object' || value === null) return false
  const cities = (value as { cities?: unknown }).cities
  return Array.isArray(cities) && cities.every((c) => typeof c === 'string')
}

/** 从 localStorage 读取；存储不可用或数据损坏时返回空记录 */
export function loadVisited(): VisitedRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    return isVisitedRecord(parsed) ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

export function saveVisited(record: VisitedRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // 隐私模式或存储已满：本次会话内仍可用，只是不持久
  }
}
