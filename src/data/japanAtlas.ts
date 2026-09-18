import japanUrl from './japan/japan-prefectures.json?url'
import { buildJapan } from '../geo/japan'
import type { JapanTopology } from '../geo/types'
import { fetchJson } from './fetchJson'
import { cachedLoader } from './useAsync'

export const loadJapan = cachedLoader(async () =>
  buildJapan(await fetchJson<JapanTopology>(japanUrl, '日本地图数据')),
)
