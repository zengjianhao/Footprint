import { useChina } from '../data/chinaAtlas'
import type { City } from '../geo/types'
import { GeoMap } from './GeoMap'
import { MapStatus } from './MapStatus'
import { SouthChinaSeaInset } from './SouthChinaSeaInset'

interface ChinaMapProps {
  visitedIds: ReadonlySet<string>
  onCityClick?: (city: City) => void
}

/** 市级单元比国家大得多，32× 已足够看清最小的市 */
const CHINA_MAX_SCALE = 32

export function ChinaMap({ visitedIds, onCityClick }: ChinaMapProps) {
  const state = useChina()
  if (state.status !== 'ready') return <MapStatus state={state} label="中国地图" />
  return (
    <GeoMap
      model={state.value}
      visitedIds={visitedIds}
      onUnitClick={onCityClick}
      maxScale={CHINA_MAX_SCALE}
      label="中国地图"
    >
      <SouthChinaSeaInset inset={state.value.inset} />
    </GeoMap>
  )
}
