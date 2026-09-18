/**
 * 生成中国市级行政区划 TopoJSON：src/data/china/china-cities.json
 *
 * 数据来源：阿里云 DataV.GeoAtlas（https://datav.aliyun.com/portal/school/atlas/area_selector），
 * 底层为高德 / 民政部行政区划数据。仅在需要更新数据时手动运行：npm run data:china
 *
 * 规则：
 * - 各省的 `{adcode}_full.json` 给出市级单元（含省直辖县级行政区）
 * - 直辖市、港澳台没有市级层（台湾无子级数据），各自作为一个单元
 * - 十段线（100000_JD）单独保留为要素（数据源里是十段细长多边形）
 * - 数据源的多边形外环为逆时针（RFC 7946），d3-geo 的球面多边形要求外环顺时针，
 *   否则会被当成"除该区域外的整个地球"，因此写入前按 d3 约定重绕
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { geoArea } from 'd3-geo'
import { topology } from 'topojson-server'
import { quantize } from 'topojson-client'
import { presimplify, simplify, sphericalTriangleArea } from 'topojson-simplify'

const BASE = 'https://geo.datav.aliyun.com/areas_v3/bound'
const OUT = new URL('../src/data/china/china-cities.json', import.meta.url)
/** 没有市级层、按单个单元处理的省级行政区 */
const SINGLE_UNIT = new Set([110000, 120000, 310000, 500000, 710000, 810000, 820000])
/** 简化阈值（球面三角形面积，单位 sr）；越大越粗糙。1.5e-8 ≈ 0.6 km²，输出约 950 KB（gzip 320 KB） */
const MIN_WEIGHT = Number(process.env.MIN_WEIGHT ?? 1.5e-8)
const QUANTIZATION = 1e5
/** 原始下载缓存，便于反复调整简化参数 */
const CACHE_DIR = new URL('../node_modules/.cache/china-data/', import.meta.url)

async function fetchJson(url) {
  mkdirSync(CACHE_DIR, { recursive: true })
  const cached = new URL(url.slice(url.lastIndexOf('/') + 1), CACHE_DIR)
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

function rewindGeometry(geometry) {
  if (geometry.type === 'Polygon') return { ...geometry, coordinates: rewindPolygon(geometry.coordinates) }
  if (geometry.type === 'MultiPolygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(rewindPolygon) }
  }
  return geometry
}

function toCity(f, province) {
  const p = f.properties
  return {
    type: 'Feature',
    geometry: rewindGeometry(f.geometry),
    properties: {
      adcode: String(p.adcode),
      name: p.name,
      province: String(province.properties.adcode),
      provinceName: province.properties.name,
      center: p.center ?? province.properties.center,
    },
  }
}

const country = await fetchJson(`${BASE}/100000_full.json`)
const provinces = country.features.filter((f) => f.properties.level === 'province')
const dashLine = country.features.find((f) => f.properties.adcode === '100000_JD')
if (provinces.length !== 34 || !dashLine) throw new Error('unexpected 100000_full.json structure')

const cities = []
for (const province of provinces) {
  const { adcode, name } = province.properties
  if (SINGLE_UNIT.has(adcode)) {
    cities.push(toCity(province, province))
    console.log(`${name}: 1 (single unit)`)
    continue
  }
  const full = await fetchJson(`${BASE}/${adcode}_full.json`)
  for (const f of full.features) cities.push(toCity(f, province))
  console.log(`${name}: ${full.features.length}`)
}

const seen = new Set()
for (const c of cities) {
  if (seen.has(c.properties.adcode)) throw new Error(`duplicate adcode ${c.properties.adcode}`)
  seen.add(c.properties.adcode)
  if (!c.geometry) throw new Error(`missing geometry: ${c.properties.name}`)
}

let topo = topology(
  {
    cities: { type: 'FeatureCollection', features: cities },
    dashLine: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: rewindGeometry(dashLine.geometry), properties: {} }],
    },
  },
  QUANTIZATION,
)
// presimplify 会去掉量化并展开为绝对坐标，简化后必须重新量化，否则文件会膨胀数倍
topo = quantize(simplify(presimplify(topo, sphericalTriangleArea), MIN_WEIGHT), QUANTIZATION)
topo.source = 'DataV.GeoAtlas (https://geo.datav.aliyun.com/areas_v3/bound)'
topo.generatedAt = new Date().toISOString().slice(0, 10)

const json = JSON.stringify(topo)
writeFileSync(OUT, json)
console.log(`\n${cities.length} city units, ${topo.arcs.length} arcs, ${(json.length / 1024).toFixed(0)} KB -> ${OUT.pathname}`)
