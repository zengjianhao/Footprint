import usUrl from './us/us-states.json?url'
import { buildUs } from '../geo/us'
import type { UsTopology } from '../geo/types'
import { fetchJson } from './fetchJson'
import { cachedLoader } from './useAsync'

export const loadUs = cachedLoader(async () =>
  buildUs(await fetchJson<UsTopology>(usUrl, '美国地图数据')),
)
