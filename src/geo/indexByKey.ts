import type { MapUnit } from './types'

/** 建立 key → 单元 索引；key 重复说明数据有问题，直接报错以免静默覆盖 */
export function indexByKey<U extends MapUnit>(units: U[]): ReadonlyMap<string, U> {
  const byKey = new Map<string, U>()
  for (const unit of units) {
    const existing = byKey.get(unit.key)
    if (existing) {
      throw new Error(`Duplicate map unit key "${unit.key}": ${existing.name} / ${unit.name}`)
    }
    byKey.set(unit.key, unit)
  }
  return byKey
}
