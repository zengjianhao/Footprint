import { useCallback, useEffect, useState } from 'react'
import { DETAIL_MAPS } from './data/detailMaps'
import type { DetailMapSpec } from './data/detailMaps'
import type { Country, MapUnit } from './geo/types'
import { DetailMap } from './map/DetailMap'
import { WorldMap } from './map/WorldMap'
import { useVisited } from './state/useVisited'

type View = { kind: 'world' } | { kind: 'detail'; spec: DetailMapSpec }

const EMPTY: ReadonlySet<string> = new Set()

function App() {
  const [view, setView] = useState<View>({ kind: 'world' })
  const { visited, toggleCountry, toggleUnit } = useVisited()

  const goWorld = useCallback(() => setView({ kind: 'world' }), [])
  const goDetail = useCallback((spec: DetailMapSpec) => setView({ kind: 'detail', spec }), [])

  // 世界地图上点任何国家都是标记去过，不再是进入精细地图
  const handleCountryClick = useCallback(
    (country: Country) => toggleCountry(country.key),
    [toggleCountry],
  )

  const detail = view.kind === 'detail' ? view.spec : null
  const handleUnitClick = useCallback(
    (unit: MapUnit) => {
      if (detail) toggleUnit(detail, unit.key)
    },
    [detail, toggleUnit],
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

  const visitedUnits = detail ? (visited.units[detail.id] ?? EMPTY) : EMPTY

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
        <WorldMap visitedIds={visited.countries} onCountryClick={handleCountryClick} />
      )}

      {detail ? (
        <nav className="nav" aria-label="地图层级">
          <button type="button" className="nav__button" onClick={goWorld}>
            ‹ 世界地图
          </button>
          <span className="nav__current">{detail.label}</span>
          {visitedUnits.size > 0 && (
            <span className="nav__count">
              已去过 {visitedUnits.size} {detail.unitNoun}
            </span>
          )}
        </nav>
      ) : (
        // 世界地图上点击是标记，进入精细地图改由这里，触屏也能用
        <nav className="nav nav--stacked" aria-label="精细地图">
          <span className="nav__current">精细地图</span>
          {DETAIL_MAPS.map((spec) => (
            <button
              key={spec.id}
              type="button"
              className="nav__button"
              onClick={() => goDetail(spec)}
            >
              {spec.label} ›
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

export default App
