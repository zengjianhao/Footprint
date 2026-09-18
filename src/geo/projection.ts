import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { GeoPath, GeoProjection } from 'd3-geo'
import type { CountryFeatureCollection } from './types'

/** SVG viewBox 的逻辑宽度；高度由投影拟合结果决定 */
export const MAP_WIDTH = 1000

/**
 * 中央经线（东经）。150°E 与国内出版的世界地图一致：太平洋居中、中国位于地图中部。
 * 对应的切割线在 30°W，会把格陵兰切成两半分别出现在地图左右两端。
 */
export const CENTRAL_LONGITUDE = 150

export interface FittedProjection {
  projection: GeoProjection
  path: GeoPath
  width: number
  height: number
}

/**
 * Natural Earth 折中投影（不等积，但高纬度形状更接近直觉），按宽度拟合到给定要素集合：
 * fitWidth 会把要素的外接框左上角放在 (0, 0)，宽度恰好为 MAP_WIDTH。
 */
export function createProjection(collection: CountryFeatureCollection): FittedProjection {
  const projection = geoNaturalEarth1().rotate([-CENTRAL_LONGITUDE, 0]).fitWidth(MAP_WIDTH, collection)
  const path = geoPath(projection)
  const [, [, maxY]] = path.bounds(collection)
  return { projection, path, width: MAP_WIDTH, height: Math.ceil(maxY) }
}
