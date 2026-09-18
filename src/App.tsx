import { useCallback, useEffect, useMemo, useState } from 'react'
import type { City, Country } from './geo/types'
import { deriveVisitedCountries } from './geo/visitedCountries'
import { ChinaMap } from './map/ChinaMap'
import { WorldMap } from './map/WorldMap'
import { useVisitedCities } from './state/useVisited'

type View = { kind: 'world' } | { kind: 'china' }

/** 世界地图上点击后进入中国地图的要素：中国大陆、台湾、香港、澳门（数据集把它们画成独立要素） */
const CHINA_ENTRY_KEYS: ReadonlySet<string> = new Set(['156', '158', '344', '446'])

function App() {
  const [view, setView] = useState<View>({ kind: 'world' })
  const { visitedCities, toggleCity } = useVisitedCities()
  // 去过任何一个市，世界地图上对应的要素就点亮
  const visitedCountries = useMemo(() => deriveVisitedCountries(visitedCities), [visitedCities])

  const goWorld = useCallback(() => setView({ kind: 'world' }), [])

  const handleCountryClick = useCallback((country: Country) => {
    if (CHINA_ENTRY_KEYS.has(country.key)) setView({ kind: 'china' })
  }, [])

  const handleCityClick = useCallback((city: City) => toggleCity(city.key), [toggleCity])

  // Esc 返回世界地图
  useEffect(() => {
    if (view.kind === 'world') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goWorld()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view.kind, goWorld])

  return (
    <div className="app">
      {view.kind === 'world' ? (
        <WorldMap visitedIds={visitedCountries} onCountryClick={handleCountryClick} />
      ) : (
        <ChinaMap visitedIds={visitedCities} onCityClick={handleCityClick} />
      )}
      {view.kind === 'china' && (
        <nav className="nav" aria-label="地图层级">
          <button type="button" className="nav__back" onClick={goWorld}>
            ‹ 世界地图
          </button>
          <span className="nav__current">中国</span>
          {visitedCities.size > 0 && (
            <span className="nav__count">已去过 {visitedCities.size} 个市</span>
          )}
        </nav>
      )}
    </div>
  )
}

export default App
