import type { GeoPath, GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'

/** 地图上可悬停、可点击的最小单元：世界地图上是国家，中国地图上是市 */
export interface MapUnit {
  /** 稳定唯一键：国家用 ISO 3166-1 数字编码，市用行政区划代码 */
  key: string
  /** 主显示名 */
  name: string
  /** 次级信息（如所属省份） */
  subtitle?: string
  /** 预计算的 SVG path `d` 字符串（viewBox 坐标系） */
  d: string
}

/** 一层边界线 */
export interface BorderLayer {
  d: string
  /** minor：单元之间的细线；major：上一级行政区的粗线（省界、国界与海岸线） */
  kind: 'minor' | 'major'
}

/** 非交互的装饰线，如十段线 */
export interface DecorationLayer {
  d: string
  kind: 'dash-line'
}

export interface MapModel<U extends MapUnit = MapUnit> {
  units: U[]
  byKey: ReadonlyMap<string, U>
  borders: BorderLayer[]
  decorations?: DecorationLayer[]
  /** SVG viewBox 尺寸 */
  width: number
  height: number
  /** 经纬度 → viewBox 坐标；后续城市点位复用 */
  projection: GeoProjection
  path: GeoPath
}

// ---------- 世界地图（world-atlas） ----------

export type CountryProperties = { name: string }
export type CountriesCollection = GeometryCollection<CountryProperties>
export type WorldTopology = Topology<{ countries: CountriesCollection }>
export type CountryFeature = Feature<Geometry, CountryProperties>
export type CountryFeatureCollection = FeatureCollection<Geometry, CountryProperties>

export interface Country extends MapUnit {
  /** ISO 3166-1 数字编码（如 "156"）；数据集中缺失时为 undefined */
  isoNumeric?: string
  /** 数据集自带的英文名（缩写形式，如 "W. Sahara"） */
  nameEn: string
  feature: CountryFeature
}

export type WorldModel = MapModel<Country>

// ---------- 中国地图（由 scripts/build-china-data.mjs 生成） ----------

export type CityProperties = {
  adcode: string
  name: string
  /** 所属省级行政区代码 */
  province: string
  provinceName: string
  /** 驻地经纬度 */
  center: [number, number]
}
export type CitiesCollection = GeometryCollection<CityProperties>
export type ChinaTopology = Topology<{ cities: CitiesCollection; dashLine: GeometryCollection }>
export type CityFeature = Feature<Geometry, CityProperties>
export type CityFeatureCollection = FeatureCollection<Geometry, CityProperties>

export interface City extends MapUnit {
  adcode: string
  province: string
  provinceName: string
  center: [number, number]
  feature: CityFeature
}

/** 南海诸岛附图：位于主图右下角；路径坐标相对附图左上角 */
export interface InsetModel {
  x: number
  y: number
  width: number
  height: number
  landD: string
  bordersD: string
  dashLineD: string
}

export interface ChinaModel extends MapModel<City> {
  inset: InsetModel
}
