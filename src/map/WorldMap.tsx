import { useWorld } from '../data/worldAtlas'
import type { Country } from '../geo/types'
import { GeoMap } from './GeoMap'
import { MapStatus } from './MapStatus'

interface WorldMapProps {
  visitedIds: ReadonlySet<string>
  onCountryClick?: (country: Country) => void
}

export function WorldMap({ visitedIds, onCountryClick }: WorldMapProps) {
  const state = useWorld()
  if (state.status !== 'ready') return <MapStatus state={state} label="世界地图" />
  return (
    <GeoMap model={state.value} visitedIds={visitedIds} onUnitClick={onCountryClick} label="世界地图" />
  )
}
