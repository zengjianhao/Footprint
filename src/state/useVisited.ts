import { useCallback, useEffect, useState } from 'react'
import { loadVisited, saveVisited } from './visitedStorage'

/** 去过的市：内存中用 Set，变化时同步写回 localStorage */
export function useVisitedCities() {
  const [visitedCities, setVisitedCities] = useState<ReadonlySet<string>>(
    () => new Set(loadVisited().cities),
  )

  useEffect(() => {
    saveVisited({ cities: [...visitedCities] })
  }, [visitedCities])

  const toggleCity = useCallback((key: string) => {
    setVisitedCities((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  return { visitedCities, toggleCity }
}
