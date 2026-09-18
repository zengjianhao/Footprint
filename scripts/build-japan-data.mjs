/**
 * 生成日本都道府县 TopoJSON：src/data/japan/japan-prefectures.json
 *
 * 数据来源：dataofjapan/land 的 japan.topojson（https://github.com/dataofjapan/land），
 * 由国土地理院「地球地图日本」的 Shapefile 转换而来；使用需注明出处「地球地図日本（国土地理院）」。
 * 仅在需要更新数据时手动运行：npm run data:japan
 *
 * 规则：
 * - 47 个都道府县各为一个单元，key 用 ISO 3166-2 代码（JP-01 … JP-47，与都道府县码一致）
 * - 附加中文名、日文名与所属地方（八地方区分，冲绳归九州）
 * - 数据里北海道含北方四岛、东京含伊豆与小笠原群岛，按原样保留
 */
import { writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { topology } from 'topojson-server'
import { fetchJsonCached, rewindGeometry, simplifyTopology } from './lib/geo.mjs'

const SOURCE = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.topojson'
const OUT = new URL('../src/data/japan/japan-prefectures.json', import.meta.url)
const CACHE_DIR = new URL('../node_modules/.cache/japan-data/', import.meta.url)
/** 简化阈值（球面三角形面积，单位 sr）；源数据约 6 万点，轻度简化即可 */
const MIN_WEIGHT = Number(process.env.MIN_WEIGHT ?? 2e-9)
const QUANTIZATION = 1e5

/** 都道府县码 → 中文名 */
const NAMES_ZH = {
  1: '北海道', 2: '青森县', 3: '岩手县', 4: '宫城县', 5: '秋田县', 6: '山形县', 7: '福岛县',
  8: '茨城县', 9: '栃木县', 10: '群马县', 11: '埼玉县', 12: '千叶县', 13: '东京都', 14: '神奈川县',
  15: '新潟县', 16: '富山县', 17: '石川县', 18: '福井县', 19: '山梨县', 20: '长野县', 21: '岐阜县',
  22: '静冈县', 23: '爱知县', 24: '三重县', 25: '滋贺县', 26: '京都府', 27: '大阪府', 28: '兵库县',
  29: '奈良县', 30: '和歌山县', 31: '鸟取县', 32: '岛根县', 33: '冈山县', 34: '广岛县', 35: '山口县',
  36: '德岛县', 37: '香川县', 38: '爱媛县', 39: '高知县', 40: '福冈县', 41: '佐贺县', 42: '长崎县',
  43: '熊本县', 44: '大分县', 45: '宫崎县', 46: '鹿儿岛县', 47: '冲绳县',
}

/** 八地方区分：[起始码, 结束码, 地方名] */
const REGIONS = [
  [1, 1, '北海道'],
  [2, 7, '东北'],
  [8, 14, '关东'],
  [15, 23, '中部'],
  [24, 30, '近畿'],
  [31, 35, '中国'],
  [36, 39, '四国'],
  [40, 47, '九州'],
]

function regionOf(id) {
  const hit = REGIONS.find(([from, to]) => id >= from && id <= to)
  if (!hit) throw new Error(`no region for prefecture ${id}`)
  return hit[2]
}

const source = await fetchJsonCached(SOURCE, CACHE_DIR)
const collection = feature(source, source.objects.japan)
if (collection.features.length !== 47) throw new Error(`expected 47 prefectures, got ${collection.features.length}`)

const prefectures = collection.features
  .map((f) => {
    const id = Number(f.properties.id)
    const name = NAMES_ZH[id]
    if (!name) throw new Error(`unknown prefecture id ${id}`)
    return {
      type: 'Feature',
      geometry: rewindGeometry(f.geometry),
      properties: {
        code: `JP-${String(id).padStart(2, '0')}`,
        name,
        nameJa: f.properties.nam_ja,
        nameEn: f.properties.nam,
        region: regionOf(id),
      },
    }
  })
  .sort((a, b) => a.properties.code.localeCompare(b.properties.code))

let topo = topology({ prefectures: { type: 'FeatureCollection', features: prefectures } }, QUANTIZATION)
topo = simplifyTopology(topo, MIN_WEIGHT, QUANTIZATION)
topo.source = 'dataofjapan/land japan.topojson, derived from 地球地図日本 (国土地理院)'
topo.generatedAt = new Date().toISOString().slice(0, 10)

const json = JSON.stringify(topo)
writeFileSync(OUT, json)
console.log(`${prefectures.length} prefectures, ${topo.arcs.length} arcs, ${topo.arcs.reduce((n, a) => n + a.length, 0)} points, ${(json.length / 1024).toFixed(0)} KB -> ${OUT.pathname}`)
