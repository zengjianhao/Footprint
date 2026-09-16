import { geoEqualEarth, geoPath } from 'd3-geo'
import type { GeoPath, GeoProjection } from 'd3-geo'
import type { CountryFeatureCollection } from './types'

/** SVG viewBox 的逻辑宽度；高度由投影拟合结果决定 */
export const MAP_WIDTH = 1000

export interface FittedProjection {
  projection: GeoProjection
  path: GeoPath
  width: number
  height: number
}

/**
 * Equal Earth 投影，按宽度拟合到给定要素集合：
 * fitWidth 会把要素的外接框左上角放在 (0, 0)，宽度恰好为 MAP_WIDTH。
 */
export function createProjection(collection: CountryFeatureCollection): FittedProjection {
  const projection = geoEqualEarth().fitWidth(MAP_WIDTH, collection)
  const path = geoPath(projection)
  const [, [, maxY]] = path.bounds(collection)
  return { projection, path, width: MAP_WIDTH, height: Math.ceil(maxY) }
}
