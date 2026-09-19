import { chinaVisitedCountryKeys } from '../geo/china'
import type { DetailCountryId, MapModel } from '../geo/types'
import { loadChina } from './chinaAtlas'
import { loadJapan } from './japanAtlas'

/** 一个有精细地图的国家的全部配置 */
export interface DetailMapSpec {
  id: DetailCountryId
  /** 导航栏标题 */
  label: string
  /** 计数用量词，如「个市」 */
  unitNoun: string
  /** 世界地图上点击后进入该国的要素 key */
  entryKeys: ReadonlySet<string>
  /** 最大缩放倍率：单元越大，需要的倍率越小 */
  maxScale: number
  load: () => Promise<MapModel>
  /** 由去过的单元推导世界地图上应点亮的要素 key */
  visitedCountryKeys: (units: ReadonlySet<string>) => Iterable<string>
}

const CHINA: DetailMapSpec = {
  id: 'china',
  label: '中国',
  unitNoun: '个市',
  // 数据集把中国大陆、台湾、香港、澳门画成独立要素，点任何一个都进入中国地图
  entryKeys: new Set(['156', '158', '344', '446']),
  maxScale: 32,
  load: loadChina,
  visitedCountryKeys: chinaVisitedCountryKeys,
}

const JAPAN: DetailMapSpec = {
  id: 'japan',
  label: '日本',
  unitNoun: '个都道府县',
  entryKeys: new Set(['392']),
  maxScale: 24,
  load: loadJapan,
  visitedCountryKeys: (units) => (units.size > 0 ? ['392'] : []),
}

export const DETAIL_MAPS: readonly DetailMapSpec[] = [CHINA, JAPAN]

export function detailMapForCountry(countryKey: string): DetailMapSpec | undefined {
  return DETAIL_MAPS.find((spec) => spec.entryKeys.has(countryKey))
}

export type VisitedUnitsByCountry = Readonly<Partial<Record<DetailCountryId, ReadonlySet<string>>>>

const EMPTY: ReadonlySet<string> = new Set()

/** 汇总所有国家去过的单元，得到世界地图上应点亮的要素 key */
export function deriveVisitedCountryKeys(visited: VisitedUnitsByCountry): ReadonlySet<string> {
  const keys = new Set<string>()
  for (const spec of DETAIL_MAPS) {
    for (const key of spec.visitedCountryKeys(visited[spec.id] ?? EMPTY)) keys.add(key)
  }
  return keys
}
