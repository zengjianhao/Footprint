import worldUrl from 'world-atlas/countries-50m.json?url'
import { buildWorld } from '../geo/world'
import type { WorldModel, WorldTopology } from '../geo/types'
import { fetchJson } from './fetchJson'
import { cachedLoader, useAsync } from './useAsync'
import type { AsyncState } from './useAsync'

export const loadWorld = cachedLoader(async () =>
  buildWorld(await fetchJson<WorldTopology>(worldUrl, '世界地图数据')),
)

export function useWorld(): AsyncState<WorldModel> {
  return useAsync(loadWorld)
}
