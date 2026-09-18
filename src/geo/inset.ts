import { geoBounds, geoPath } from 'd3-geo'
import type { GeoPath, GeoPermissibleObjects, GeoProjection } from 'd3-geo'
import type { Feature, Geometry, MultiLineString, Polygon } from 'geojson'
import type { InsetModel } from './types'

export interface LonLatBounds {
  west: number
  south: number
  east: number
  north: number
}

/** 附图在 viewBox 中的尺寸、到主图边缘的边距、内边距，以及与主图要素之间的最小间隔 */
export interface InsetSize {
  width: number
  height: number
  margin: number
  padding: number
  gap: number
}

export interface InsetLayout {
  x: number
  y: number
  /** 为容纳附图而可能向南扩展后的主图高度 */
  height: number
}

type Bounds = [[number, number], [number, number]]

/** 经纬度矩形 → 多边形。注意 d3 的球面多边形要求外环顺时针，逆时针会被当成范围之外的整个地球 */
export function boundsPolygon(b: LonLatBounds): Polygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [b.west, b.south],
        [b.west, b.north],
        [b.east, b.north],
        [b.east, b.south],
        [b.west, b.south],
      ],
    ],
  }
}

/** 要素的经纬度外接框是否与范围相交 */
export function intersectsBounds(feature: Feature, b: LonLatBounds): boolean {
  const [[west, south], [east, north]] = geoBounds(feature)
  return east >= b.west && west <= b.east && north >= b.south && south <= b.north
}

export function polygonsOf(geometry: Geometry): Polygon[] {
  if (geometry.type === 'Polygon') return [geometry]
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coordinates) => ({ type: 'Polygon', coordinates }))
  }
  return []
}

/**
 * 决定附图位置与主图高度：附图贴主图右下角，但不能盖住主图上落在同一列的任何可见多边形
 * （整体在主图之外的多边形不算，如东京的小笠原群岛）；装饰要素（如十段线）允许被整体盖住，
 * 但不能被切成半截。不足的高度向南扩展主图，与出版地图的版式一致。
 */
export function layoutInset(
  path: GeoPath,
  features: readonly Feature[],
  decorations: readonly Polygon[],
  mapWidth: number,
  fittedHeight: number,
  size: InsetSize,
): InsetLayout {
  const x = mapWidth - size.width - size.margin
  const reachesColumn = (bounds: Bounds) => bounds[1][0] >= x - size.gap

  let top = 0
  for (const feature of features) {
    for (const polygon of polygonsOf(feature.geometry)) {
      const bounds = path.bounds(polygon)
      if (!reachesColumn(bounds) || bounds[0][1] >= fittedHeight) continue
      top = Math.max(top, bounds[1][1] + size.gap)
    }
  }

  const decorationBounds = decorations
    .map((polygon) => path.bounds(polygon))
    .filter(reachesColumn)
    .sort((a, b) => a[0][1] - b[0][1])
  for (const bounds of decorationBounds) {
    if (bounds[0][1] < top) top = Math.max(top, bounds[1][1] + size.gap)
  }

  const height = Math.max(fittedHeight, Math.ceil(top + size.height + size.margin))
  return { x, y: height - size.height - size.margin, height }
}

export interface InsetContentSpec {
  /** 未拟合的投影，会在此拟合到 region */
  projection: GeoProjection
  region: LonLatBounds
  size: InsetSize
  label: string
  /** 要绘制的要素（已按范围筛过），超出附图的部分由裁剪去掉 */
  land: readonly Feature[]
  borders: MultiLineString | null
  decoration?: GeoPermissibleObjects
}

/** 用附图自己的投影把内容投到附图局部坐标 */
export function buildInsetContent(spec: InsetContentSpec, layout: InsetLayout): InsetModel {
  const { width, height, padding } = spec.size
  const projection = spec.projection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    boundsPolygon(spec.region),
  )
  const path = geoPath(projection)
  return {
    x: layout.x,
    y: layout.y,
    width,
    height,
    label: spec.label,
    landD: path({ type: 'FeatureCollection', features: [...spec.land] }) ?? '',
    bordersD: spec.borders ? (path(spec.borders) ?? '') : '',
    decorationD: spec.decoration ? (path(spec.decoration) ?? '') : undefined,
  }
}
