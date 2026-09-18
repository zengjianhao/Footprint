import { useCallback, useEffect, useMemo, useState } from 'react'
import { deriveVisitedCountryKeys, detailMapForCountry } from './data/detailMaps'
import type { DetailMapSpec } from './data/detailMaps'
import type { Country, MapUnit } from './geo/types'
import { DetailMap } from './map/DetailMap'
import { WorldMap } from './map/WorldMap'
import { useVisited } from './state/useVisited'

type View = { kind: 'world' } | { kind: 'detail'; spec: DetailMapSpec }

const EMPTY: ReadonlySet<string> = new Set()

function App() {
  const [view, setView] = useState<View>({ kind: 'world' })
  const { visited, toggle } = useVisited()
  // 在任何国家去过任何一个单元，世界地图上对应的要素就点亮
  const visitedCountries = useMemo(() => deriveVisitedCountryKeys(visited), [visited])

  const goWorld = useCallback(() => setView({ kind: 'world' }), [])

  const handleCountryClick = useCallback((country: Country) => {
    const spec = detailMapForCountry(country.key)
    if (spec) setView({ kind: 'detail', spec })
  }, [])

  const detail = view.kind === 'detail' ? view.spec : null
  const detailId = detail?.id
  const handleUnitClick = useCallback(
    (unit: MapUnit) => {
      if (detailId) toggle(detailId, unit.key)
    },
    [detailId, toggle],
  )

  // Esc 返回世界地图
  useEffect(() => {
    if (!detail) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goWorld()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detail, goWorld])

  const visitedUnits = detail ? (visited[detail.id] ?? EMPTY) : EMPTY

  return (
    <div className="app">
      {detail ? (
        <DetailMap
          key={detail.id}
          spec={detail}
          visitedIds={visitedUnits}
          onUnitClick={handleUnitClick}
        />
      ) : (
        <WorldMap visitedIds={visitedCountries} onCountryClick={handleCountryClick} />
      )}
      {detail && (
        <nav className="nav" aria-label="地图层级">
          <button type="button" className="nav__back" onClick={goWorld}>
            ‹ 世界地图
          </button>
          <span className="nav__current">{detail.label}</span>
          {visitedUnits.size > 0 && (
            <span className="nav__count">
              已去过 {visitedUnits.size} {detail.unitNoun}
            </span>
          )}
        </nav>
      )}
    </div>
  )
}

export default App
