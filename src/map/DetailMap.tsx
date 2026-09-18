import type { DetailMapSpec } from '../data/detailMaps'
import { useAsync } from '../data/useAsync'
import type { MapUnit } from '../geo/types'
import { GeoMap } from './GeoMap'
import { MapInset } from './MapInset'
import { MapStatus } from './MapStatus'

interface DetailMapProps {
  spec: DetailMapSpec
  visitedIds: ReadonlySet<string>
  onUnitClick?: (unit: MapUnit) => void
}

/** 某个国家的精细地图：加载该国数据后交给通用 GeoMap 渲染，附图按需叠加 */
export function DetailMap({ spec, visitedIds, onUnitClick }: DetailMapProps) {
  const state = useAsync(spec.load)
  const label = `${spec.label}地图`
  if (state.status !== 'ready') return <MapStatus state={state} label={label} />
  const model = state.value
  return (
    <GeoMap
      model={model}
      visitedIds={visitedIds}
      onUnitClick={onUnitClick}
      maxScale={spec.maxScale}
      label={label}
    >
      {model.inset && <MapInset inset={model.inset} />}
    </GeoMap>
  )
}
