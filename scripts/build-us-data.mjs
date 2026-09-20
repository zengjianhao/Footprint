/**
 * 生成美国州级 TopoJSON：src/data/us/us-states.json
 *
 * 数据来源：us-atlas（https://github.com/topojson/us-atlas）的 states-10m.json，
 * 由美国人口普查局的 cartographic boundary 文件转换而来（公有领域）。
 * 仅在需要更新数据时手动运行：npm run data:us
 *
 * 规则：
 * - 50 个州 + 哥伦比亚特区各为一个单元，key 用 ISO 3166-2 代码（US-CA …）
 * - 海外领地（波多黎各、关岛等）不在 Albers USA 投影范围内，排除
 * - 附加中文名、USPS 缩写与人口普查局四大区域
 */
import { writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { topology } from 'topojson-server'
import { fetchJsonCached, rewindGeometry, simplifyTopology } from './lib/geo.mjs'

const VERSION = '3.0.1'
const SOURCE = `https://cdn.jsdelivr.net/npm/us-atlas@${VERSION}/states-10m.json`
const OUT = new URL('../src/data/us/us-states.json', import.meta.url)
const CACHE_DIR = new URL('../node_modules/.cache/us-data/', import.meta.url)
/**
 * 源数据已是 10m 精度并量化过：它最小的顶点权重约 6e-8 sr，默认阈值 1e-9 低于全部顶点，
 * simplify 实际不删任何点。走这条流水线只是为了过滤退化环并统一量化；要真正简化需设到 1e-7 以上。
 */
const MIN_WEIGHT = Number(process.env.MIN_WEIGHT ?? 1e-9)
const QUANTIZATION = 1e5

/** 区域中文名（美国人口普查局四大区域） */
const REGION = { NE: '东北部', MW: '中西部', S: '南部', W: '西部' }

/** FIPS 代码 → [USPS 缩写, 中文名, 区域] */
const STATES = {
  '01': ['AL', '阿拉巴马州', 'S'],
  '02': ['AK', '阿拉斯加州', 'W'],
  '04': ['AZ', '亚利桑那州', 'W'],
  '05': ['AR', '阿肯色州', 'S'],
  '06': ['CA', '加利福尼亚州', 'W'],
  '08': ['CO', '科罗拉多州', 'W'],
  '09': ['CT', '康涅狄格州', 'NE'],
  '10': ['DE', '特拉华州', 'S'],
  '11': ['DC', '华盛顿哥伦比亚特区', 'S'],
  '12': ['FL', '佛罗里达州', 'S'],
  '13': ['GA', '佐治亚州', 'S'],
  '15': ['HI', '夏威夷州', 'W'],
  '16': ['ID', '爱达荷州', 'W'],
  '17': ['IL', '伊利诺伊州', 'MW'],
  '18': ['IN', '印第安纳州', 'MW'],
  '19': ['IA', '艾奥瓦州', 'MW'],
  '20': ['KS', '堪萨斯州', 'MW'],
  '21': ['KY', '肯塔基州', 'S'],
  '22': ['LA', '路易斯安那州', 'S'],
  '23': ['ME', '缅因州', 'NE'],
  '24': ['MD', '马里兰州', 'S'],
  '25': ['MA', '马萨诸塞州', 'NE'],
  '26': ['MI', '密歇根州', 'MW'],
  '27': ['MN', '明尼苏达州', 'MW'],
  '28': ['MS', '密西西比州', 'S'],
  '29': ['MO', '密苏里州', 'MW'],
  '30': ['MT', '蒙大拿州', 'W'],
  '31': ['NE', '内布拉斯加州', 'MW'],
  '32': ['NV', '内华达州', 'W'],
  '33': ['NH', '新罕布什尔州', 'NE'],
  '34': ['NJ', '新泽西州', 'NE'],
  '35': ['NM', '新墨西哥州', 'W'],
  '36': ['NY', '纽约州', 'NE'],
  '37': ['NC', '北卡罗来纳州', 'S'],
  '38': ['ND', '北达科他州', 'MW'],
  '39': ['OH', '俄亥俄州', 'MW'],
  '40': ['OK', '俄克拉何马州', 'S'],
  '41': ['OR', '俄勒冈州', 'W'],
  '42': ['PA', '宾夕法尼亚州', 'NE'],
  '44': ['RI', '罗得岛州', 'NE'],
  '45': ['SC', '南卡罗来纳州', 'S'],
  '46': ['SD', '南达科他州', 'MW'],
  '47': ['TN', '田纳西州', 'S'],
  '48': ['TX', '得克萨斯州', 'S'],
  '49': ['UT', '犹他州', 'W'],
  '50': ['VT', '佛蒙特州', 'NE'],
  '51': ['VA', '弗吉尼亚州', 'S'],
  '53': ['WA', '华盛顿州', 'W'],
  '54': ['WV', '西弗吉尼亚州', 'S'],
  '55': ['WI', '威斯康星州', 'MW'],
  '56': ['WY', '怀俄明州', 'W'],
}

const source = await fetchJsonCached(SOURCE, CACHE_DIR)
const collection = feature(source, source.objects.states)

const states = []
const skipped = []
for (const f of collection.features) {
  const fips = String(f.id)
  const meta = STATES[fips]
  if (!meta) {
    skipped.push(`${f.properties.name} (${fips})`)
    continue
  }
  const [abbr, name, region] = meta
  states.push({
    type: 'Feature',
    geometry: rewindGeometry(f.geometry),
    properties: {
      code: `US-${abbr}`,
      fips,
      abbr,
      name,
      nameEn: f.properties.name,
      region: REGION[region],
    },
  })
}
states.sort((a, b) => a.properties.code.localeCompare(b.properties.code))

const expected = Object.keys(STATES).length
if (states.length !== expected) {
  const found = new Set(states.map((s) => s.properties.fips))
  throw new Error(`expected ${expected} states, got ${states.length}; missing ${Object.keys(STATES).filter((k) => !found.has(k))}`)
}
console.log(`skipped territories: ${skipped.join(', ')}`)

let topo = topology({ states: { type: 'FeatureCollection', features: states } }, QUANTIZATION)
topo = simplifyTopology(topo, MIN_WEIGHT, QUANTIZATION)
topo.source = `us-atlas@${VERSION} states-10m.json (U.S. Census Bureau cartographic boundary files)`
topo.generatedAt = new Date().toISOString().slice(0, 10)

const json = JSON.stringify(topo)
writeFileSync(OUT, json)
console.log(`${states.length} states, ${topo.arcs.length} arcs, ${topo.arcs.reduce((n, a) => n + a.length, 0)} points, ${(json.length / 1024).toFixed(0)} KB -> ${OUT.pathname}`)
