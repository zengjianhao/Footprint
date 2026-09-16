import type { GeoPath, GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'

/** world-atlas 每个国家要素自带的属性：只有一个缩写英文名 */
export type CountryProperties = { name: string }

/** TopoJSON 中的国家几何集合 */
export type CountriesCollection = GeometryCollection<CountryProperties>

/** world-atlas countries-*.json 的整体结构 */
export type WorldTopology = Topology<{ countries: CountriesCollection }>

export type CountryFeature = Feature<Geometry, CountryProperties>
export type CountryFeatureCollection = FeatureCollection<Geometry, CountryProperties>

export interface Country {
  /** 稳定唯一键：ISO 3166-1 数字编码；数据集中无编码时为 `name:<英文名>` */
  key: string
  /** ISO 3166-1 数字编码（如 "156"）；数据集中缺失时为 undefined */
  isoNumeric?: string
  /** 展示名：中文优先，英文兜底 */
  name: string
  /** 数据集自带的英文名（缩写形式，如 "W. Sahara"） */
  nameEn: string
  feature: CountryFeature
  /** 预计算的 SVG path `d` 字符串（viewBox 坐标系） */
  d: string
}

export interface WorldModel {
  /** 参与渲染的国家（已排除南极洲） */
  countries: Country[]
  byKey: ReadonlyMap<string, Country>
  /** 国家之间的内部边界，合并为一条路径 */
  bordersD: string
  /** SVG viewBox 尺寸 */
  width: number
  height: number
  /** 经纬度 → viewBox 坐标；后续城市点位复用 */
  projection: GeoProjection
  path: GeoPath
}
