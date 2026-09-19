import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { geoArea } from 'd3-geo'
import { feature, quantize } from 'topojson-client'
import { filter, presimplify, simplify, sphericalTriangleArea } from 'topojson-simplify'

/** 下载 JSON 并缓存到 cacheDir（按 URL 最后一段命名），便于反复调整简化参数 */
export async function fetchJsonCached(url, cacheDir) {
  mkdirSync(cacheDir, { recursive: true })
  const cached = new URL(url.slice(url.lastIndexOf('/') + 1), cacheDir)
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf8'))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`)
  const text = await res.text()
  writeFileSync(cached, text)
  return JSON.parse(text)
}

const HEMISPHERE = 2 * Math.PI

/** d3 约定：外环顺时针（独立成面时面积 < 2π），内环逆时针（面积 > 2π）；不符合就反转 */
function rewindRing(ring, isExterior) {
  const area = geoArea({ type: 'Polygon', coordinates: [ring] })
  const wrong = isExterior ? area > HEMISPHERE : area < HEMISPHERE
  return wrong ? ring.slice().reverse() : ring
}

function rewindPolygon(rings) {
  return rings.map((ring, i) => rewindRing(ring, i === 0))
}

/**
 * 按 d3-geo 的球面多边形约定重绕。RFC 7946 的 GeoJSON 外环是逆时针，
 * 不重绕会被当成"除该区域外的整个地球"。
 */
export function rewindGeometry(geometry) {
  if (geometry.type === 'Polygon') return { ...geometry, coordinates: rewindPolygon(geometry.coordinates) }
  if (geometry.type === 'MultiPolygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(rewindPolygon) }
  }
  return geometry
}

/** 环面积下限（sr），约 0.02 km²：比这更小的环在任何缩放下都看不见 */
const MIN_RING_AREA = 5e-10

/**
 * 简化后有些细小的环会退化成线段或反向环（geoArea ≈ 4π），会让 geoBounds 变成整个地球，
 * 也可能在某些投影下渲染成覆盖全图的填充。这里把它们过滤掉。
 */
function ringFilter(topo) {
  return (ring, interior) => {
    const coordinates = feature(topo, { type: 'Polygon', arcs: [ring] }).geometry.coordinates[0]
    if (coordinates.length < 4) return false
    let area = geoArea({ type: 'Polygon', coordinates: [coordinates] })
    if (interior) area = 4 * Math.PI - area
    return area >= MIN_RING_AREA && area <= HEMISPHERE
  }
}

/**
 * 简化、清理退化环并重新量化。presimplify 会去掉量化并展开为绝对坐标，
 * 简化之后必须重新量化，否则文件会膨胀数倍。
 */
export function simplifyTopology(topo, minWeight, quantization) {
  const simplified = simplify(presimplify(topo, sphericalTriangleArea), minWeight)
  return quantize(filter(simplified, ringFilter(simplified)), quantization)
}
