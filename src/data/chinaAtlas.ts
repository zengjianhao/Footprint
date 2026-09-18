import chinaUrl from './china/china-cities.json?url'
import { buildChina } from '../geo/china'
import type { ChinaModel, ChinaTopology } from '../geo/types'
import { fetchJson } from './fetchJson'
import { cachedLoader, useAsync } from './useAsync'
import type { AsyncState } from './useAsync'

export const loadChina = cachedLoader(async () =>
  buildChina(await fetchJson<ChinaTopology>(chinaUrl, '中国地图数据')),
)

export function useChina(): AsyncState<ChinaModel> {
  return useAsync(loadChina)
}
