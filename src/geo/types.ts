import type { GeoPath, GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'

/** 地图上可悬停、可点击的最小单元：世界地图上是国家，精细地图上是市 / 都道府县 */
export interface MapUnit {
  /** 稳定唯一键：国家用 ISO 3166-1 数字编码，市用行政区划代码，都道府县用 ISO 3166-2 代码 */
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
  /** 右下角附图（精细地图才有） */
  inset?: InsetModel
}

/** 附图里的一个单元：key 与主图单元相同，路径用附图自己的投影 */
export interface InsetUnit {
  key: string
  d: string
}

/**
 * 附图（南海诸岛、南西诸岛）：位于主图右下角；路径坐标相对附图左上角。
 * 附图里的单元同样可以悬停与点击，只在附图中出现的单元（如冲绳、三沙）就靠这里标记。
 */
export interface InsetModel {
  x: number
  y: number
  width: number
  height: number
  label: string
  units: InsetUnit[]
  bordersD: string
  decorationD?: string
}

/** 有精细地图的国家 */
export type DetailCountryId = 'china' | 'japan' | 'us'

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

export type ChinaModel = MapModel<City>

// ---------- 日本地图（由 scripts/build-japan-data.mjs 生成） ----------

export type PrefectureProperties = {
  /** ISO 3166-2 代码，如 JP-13 */
  code: string
  /** 中文名 */
  name: string
  nameJa: string
  nameEn: string
  /** 所属地方（八地方区分） */
  region: string
}
export type PrefecturesCollection = GeometryCollection<PrefectureProperties>
export type JapanTopology = Topology<{ prefectures: PrefecturesCollection }>
export type PrefectureFeature = Feature<Geometry, PrefectureProperties>
export type PrefectureFeatureCollection = FeatureCollection<Geometry, PrefectureProperties>

export interface Prefecture extends MapUnit {
  code: string
  nameJa: string
  region: string
  feature: PrefectureFeature
}

export type JapanModel = MapModel<Prefecture>

// ---------- 美国地图（由 scripts/build-us-data.mjs 生成） ----------

export type StateProperties = {
  /** ISO 3166-2 代码，如 US-CA */
  code: string
  /** FIPS 州代码，如 06 */
  fips: string
  /** USPS 缩写，如 CA */
  abbr: string
  /** 中文名 */
  name: string
  nameEn: string
  /** 人口普查局四大区域 */
  region: string
}
export type StatesCollection = GeometryCollection<StateProperties>
export type UsTopology = Topology<{ states: StatesCollection }>
export type StateFeature = Feature<Geometry, StateProperties>
export type StateFeatureCollection = FeatureCollection<Geometry, StateProperties>

export interface State extends MapUnit {
  code: string
  abbr: string
  nameEn: string
  region: string
  feature: StateFeature
}

export type UsModel = MapModel<State>
