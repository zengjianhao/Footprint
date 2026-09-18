import { useCallback, useEffect, useState } from 'react'
import type { City, Country } from './geo/types'
import { ChinaMap } from './map/ChinaMap'
import { WorldMap } from './map/WorldMap'

type View = { kind: 'world' } | { kind: 'china' }

/** 世界地图上点击后进入中国地图的要素：中国大陆、台湾、香港、澳门（数据集把它们画成独立要素） */
const CHINA_ENTRY_KEYS: ReadonlySet<string> = new Set(['156', '158', '344', '446'])

function App() {
  const [view, setView] = useState<View>({ kind: 'world' })
  // 已去过的国家 / 城市；后续接持久化与记录 UI，目前为空
  const [visitedCountries] = useState<ReadonlySet<string>>(() => new Set())
  const [visitedCities] = useState<ReadonlySet<string>>(() => new Set())

  const goWorld = useCallback(() => setView({ kind: 'world' }), [])

  const handleCountryClick = useCallback((country: Country) => {
    if (CHINA_ENTRY_KEYS.has(country.key)) setView({ kind: 'china' })
  }, [])

  const handleCityClick = useCallback((city: City) => {
    // 后续：记录该市的足迹
    console.info('city click', city.key, city.name, city.provinceName)
  }, [])

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
        </nav>
      )}
    </div>
  )
}

export default App
