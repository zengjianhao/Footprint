import { useCallback, useEffect, useState } from 'react'
import type { VisitedUnitsByCountry } from '../data/detailMaps'
import type { DetailCountryId } from '../geo/types'
import { loadVisited, saveVisited } from './visitedStorage'
import type { VisitedUnitArrays } from './visitedStorage'

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

/** 各国去过的单元：内存中按国家分组的 Set，变化时同步写回 localStorage */
export function useVisited() {
  const [visited, setVisited] = useState<VisitedUnitsByCountry>(() => toSets(loadVisited()))

  useEffect(() => {
    saveVisited(toArrays(visited))
  }, [visited])

  const toggle = useCallback((country: DetailCountryId, key: string) => {
    setVisited((previous) => {
      const next = new Set(previous[country] ?? [])
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...previous, [country]: next }
    })
  }, [])

  return { visited, toggle }
}
