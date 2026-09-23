import { useCallback, useEffect, useState } from 'react'
import { deriveVisitedCountryKeys } from '../data/detailMaps'
import type { DetailMapSpec, VisitedUnitsByCountry } from '../data/detailMaps'
import type { DetailCountryId } from '../geo/types'
import { loadVisited, saveVisited } from './visitedStorage'
import type { VisitedArrays, VisitedUnitArrays } from './visitedStorage'

export interface VisitedState {
  /** 世界地图上点亮的国家 */
  countries: ReadonlySet<string>
  /** 精细地图里点亮的单元，按国家分组 */
  units: VisitedUnitsByCountry
}

function toSets(arrays: VisitedUnitArrays): VisitedUnitsByCountry {
  const sets: Partial<Record<DetailCountryId, ReadonlySet<string>>> = {}
  for (const [country, keys] of Object.entries(arrays) as [DetailCountryId, string[]][]) {
    sets[country] = new Set(keys)
  }
  return sets
}

function toArrays(sets: VisitedUnitsByCountry): VisitedUnitArrays {
  const arrays: VisitedUnitArrays = {}
  for (const [country, keys] of Object.entries(sets) as [DetailCountryId, ReadonlySet<string>][]) {
    arrays[country] = [...keys]
  }
  return arrays
}

function restore(stored: VisitedArrays): VisitedState {
  const units = toSets(stored.units)
  return {
    // 旧版本没有国家级记录：由已去过的单元推导，保证升级后地图上原来亮着的国家不会变灰
    countries: stored.countries ? new Set(stored.countries) : deriveVisitedCountryKeys(units),
    units,
  }
}

/**
 * 足迹记录：世界地图上的国家与精细地图里的单元。变化时同步写回 localStorage。
 *
 * 国家的点亮状态以 countries 为唯一依据，不再从单元推导，这样世界地图上每一次点击都有反馈。
 * 标记一个单元时顺带点亮它所属的国家；取消单元不会取消国家，国家只能在世界地图上取消。
 */
export function useVisited() {
  const [visited, setVisited] = useState<VisitedState>(() => restore(loadVisited()))

  useEffect(() => {
    saveVisited({ countries: [...visited.countries], units: toArrays(visited.units) })
  }, [visited])

  const toggleCountry = useCallback((key: string) => {
    setVisited((previous) => {
      const countries = new Set(previous.countries)
      if (countries.has(key)) countries.delete(key)
      else countries.add(key)
      // 取消国家时保留该国已标记的单元：用户只是想让它在世界地图上变灰，不是想清空记录
      return { ...previous, countries }
    })
  }, [])

  const toggleUnit = useCallback((spec: DetailMapSpec, key: string) => {
    setVisited((previous) => {
      const units = new Set(previous.units[spec.id])
      const marking = !units.has(key)
      if (marking) units.add(key)
      else units.delete(key)

      const countries = new Set(previous.countries)
      // 去过一个市，当然也去过它所在的国家
      if (marking) for (const k of spec.visitedCountryKeys(new Set([key]))) countries.add(k)

      return { countries, units: { ...previous.units, [spec.id]: units } }
    })
  }, [])

  return { visited, toggleCountry, toggleUnit }
}
