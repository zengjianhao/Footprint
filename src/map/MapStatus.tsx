import type { AsyncState } from '../data/useAsync'

interface MapStatusProps {
  state: Exclude<AsyncState<unknown>, { status: 'ready' }>
  label: string
}

/** 地图数据加载中 / 失败时的占位 */
export function MapStatus({ state, label }: MapStatusProps) {
  return (
    <div className="map-status">
      {state.status === 'error' ? `${label}加载失败：${state.error.message}` : `加载${label}…`}
    </div>
  )
}
