import chinaUrl from './china/china-cities.json?url'
import { buildChina } from '../geo/china'
import type { ChinaTopology } from '../geo/types'
import { fetchJson } from './fetchJson'
import { cachedLoader } from './useAsync'

export const loadChina = cachedLoader(async () =>
  buildChina(await fetchJson<ChinaTopology>(chinaUrl, '中国地图数据')),
)
