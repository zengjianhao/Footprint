import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { geoArea } from 'd3-geo'
import { quantize } from 'topojson-client'
import { presimplify, simplify, sphericalTriangleArea } from 'topojson-simplify'

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

/**
 * 简化并重新量化。presimplify 会去掉量化并展开为绝对坐标，
 * 简化之后必须重新量化，否则文件会膨胀数倍。
 */
export function simplifyTopology(topo, minWeight, quantization) {
  return quantize(simplify(presimplify(topo, sphericalTriangleArea), minWeight), quantization)
}
