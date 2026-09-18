import { geoConicEqualArea, geoNaturalEarth1, geoPath } from 'd3-geo'
import type { GeoPath, GeoPermissibleObjects, GeoProjection } from 'd3-geo'

/** SVG viewBox 的逻辑宽度；高度由投影拟合结果决定 */
export const MAP_WIDTH = 1000

/**
 * 世界地图的中央经线（东经）。150°E 与国内出版的世界地图一致：太平洋居中、中国位于地图中部。
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
 * 按宽度拟合：fitWidth 会把要素外接框的左上角放在 (0, 0)，宽度恰好为 width，
 * 高度取拟合结果的外接框高度。
 */
export function fitProjection(
  projection: GeoProjection,
  object: GeoPermissibleObjects,
  width: number,
): FittedProjection {
  projection.fitWidth(width, object)
  const path = geoPath(projection)
  const [, [, maxY]] = path.bounds(object)
  return { projection, path, width, height: Math.ceil(maxY) }
}

/** 世界地图：Natural Earth 折中投影（不等积，但高纬度形状更接近直觉） */
export function createWorldProjection(object: GeoPermissibleObjects): FittedProjection {
  return fitProjection(geoNaturalEarth1().rotate([-CENTRAL_LONGITUDE, 0]), object, MAP_WIDTH)
}

/** 中国地图：正轴等面积割圆锥投影，标准纬线 25°N / 47°N，中央经线 105°E，是国内地图的常用参数 */
export function chinaProjection(): GeoProjection {
  return geoConicEqualArea().parallels([25, 47]).rotate([-105, 0])
}

export function createChinaProjection(object: GeoPermissibleObjects): FittedProjection {
  return fitProjection(chinaProjection(), object, MAP_WIDTH)
}

/** 日本地图：同类圆锥投影，标准纬线 33°N / 43°N，中央经线 138°E */
export function japanProjection(): GeoProjection {
  return geoConicEqualArea().parallels([33, 43]).rotate([-138, 0])
}

export function createJapanProjection(object: GeoPermissibleObjects): FittedProjection {
  return fitProjection(japanProjection(), object, MAP_WIDTH)
}
