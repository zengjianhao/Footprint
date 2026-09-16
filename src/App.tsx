import { useCallback, useState } from 'react'
import { useWorld } from './data/worldAtlas'
import { WorldMap } from './map/WorldMap'
import type { Country } from './geo/types'

function App() {
  const state = useWorld()
  // 已去过的国家；后续接持久化与记录 UI，目前为空
  const [visitedIds] = useState<ReadonlySet<string>>(() => new Set())

  const handleCountryClick = useCallback((country: Country) => {
    // 后续：进入该国家的足迹详情
    console.info('country click', country.key, country.name)
  }, [])

  if (state.status === 'loading') {
    return <div className="app app--status">加载地图…</div>
  }
  if (state.status === 'error') {
    return <div className="app app--status">地图加载失败：{state.error.message}</div>
  }
  return (
    <div className="app">
      <WorldMap world={state.world} visitedIds={visitedIds} onCountryClick={handleCountryClick} />
    </div>
  )
}

export default App
