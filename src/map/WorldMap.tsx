import { useWorld } from '../data/worldAtlas'
import { detailMapForCountry } from '../data/detailMaps'
import type { Country } from '../geo/types'
import { GeoMap } from './GeoMap'
import { MapStatus } from './MapStatus'

interface WorldMapProps {
  visitedIds: ReadonlySet<string>
  onCountryClick?: (country: Country) => void
}

/** 世界地图的悬停提示：点击会发生什么，以及这个国家还能不能标得更细 */
function countryHint(country: Country, visited: boolean): string {
  const base = visited ? '再点一次取消' : '点击标为去过'
  return detailMapForCountry(country.key) ? `${base} · 可标得更细` : base
}

export function WorldMap({ visitedIds, onCountryClick }: WorldMapProps) {
  const state = useWorld()
  if (state.status !== 'ready') return <MapStatus state={state} label="世界地图" />
  return (
    <GeoMap
      model={state.value}
      visitedIds={visitedIds}
      onUnitClick={onCountryClick}
      hintFor={countryHint}
      label="世界地图"
    />
  )
}
