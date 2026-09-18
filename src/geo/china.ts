import { geoBounds, geoPath } from 'd3-geo'
import type { Polygon } from 'geojson'
import { feature, mesh } from 'topojson-client'
import type { GeometryObject } from 'topojson-specification'
import { indexByKey } from './indexByKey'
import { chinaProjection, createChinaProjection } from './projection'
import type {
  ChinaModel,
  ChinaTopology,
  CitiesCollection,
  City,
  CityFeatureCollection,
  CityProperties,
  InsetModel,
} from './types'

/** 三沙市：辖区在南海深处，主图拟合时排除，由南海诸岛附图呈现 */
const SANSHA_ADCODE = '460300'

/** 南海诸岛附图覆盖的经纬度范围（西、南、东、北） */
const INSET_BOUNDS = { west: 106, south: 2, east: 124, north: 24 }
/** 拟合用的范围多边形。注意 d3 的球面多边形要求外环顺时针，逆时针会被当成范围之外的整个地球 */
const INSET_REGION: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [INSET_BOUNDS.west, INSET_BOUNDS.south],
      [INSET_BOUNDS.west, INSET_BOUNDS.north],
      [INSET_BOUNDS.east, INSET_BOUNDS.north],
      [INSET_BOUNDS.east, INSET_BOUNDS.south],
      [INSET_BOUNDS.west, INSET_BOUNDS.south],
    ],
  ],
}
/** 附图在 viewBox 中的尺寸与边距 */
const INSET_SIZE = { width: 150, height: 190, margin: 12, padding: 6 }

/** TopoJSON 几何对象上的市属性；NullObject 等分支没有属性时返回 undefined */
function cityPropertiesOf(geometry: GeometryObject): CityProperties | undefined {
  return geometry.properties as CityProperties | undefined
}

function provinceOf(geometry: GeometryObject): string | undefined {
  return cityPropertiesOf(geometry)?.province
}

/** 省界、国界与海岸线：不同省的市之间的边界，以及所有外边界 */
function isMajorBorder(a: GeometryObject, b: GeometryObject): boolean {
  return a === b || provinceOf(a) !== provinceOf(b)
}

/** 市界：同一省内相邻两市之间的边界 */
function isMinorBorder(a: GeometryObject, b: GeometryObject): boolean {
  return a !== b && provinceOf(a) === provinceOf(b)
}

/** 把生成的中国市级 TopoJSON 转成可直接渲染的模型 */
export function buildChina(topology: ChinaTopology): ChinaModel {
  const citiesObject = topology.objects.cities
  const collection: CityFeatureCollection = feature(topology, citiesObject)
  const mainland: CityFeatureCollection = {
    type: 'FeatureCollection',
    features: collection.features.filter((f) => f.properties.adcode !== SANSHA_ADCODE),
  }
  const { projection, path, width, height } = createChinaProjection(mainland)

  const units: City[] = collection.features.map((f) => {
    const p = f.properties
    return {
      key: p.adcode,
      name: p.name,
      // 直辖市、港澳台本身就是一个单元，不再重复显示省名
      subtitle: p.provinceName === p.name ? undefined : p.provinceName,
      adcode: p.adcode,
      province: p.province,
      provinceName: p.provinceName,
      center: p.center,
      feature: f,
      d: path(f) ?? '',
    }
  })

  const minor = mesh(topology, citiesObject, isMinorBorder)
  const major = mesh(topology, citiesObject, isMajorBorder)
  // 十段线在数据源里是 MultiPolygon：每一段都是细长的多边形，按填充绘制
  const dashLine = feature(topology, topology.objects.dashLine)

  return {
    units,
    byKey: indexByKey(units),
    borders: [
      { d: path(minor) ?? '', kind: 'minor' },
      { d: path(major) ?? '', kind: 'major' },
    ],
    decorations: [{ d: path(dashLine) ?? '', kind: 'dash-line' }],
    inset: buildInset(topology, collection, width, height),
    width,
    height,
    projection,
    path,
  }
}

/** 南海诸岛附图：用同一投影单独拟合到南海范围，只渲染与该范围相交的市 */
function buildInset(
  topology: ChinaTopology,
  collection: CityFeatureCollection,
  mapWidth: number,
  mapHeight: number,
): InsetModel {
  const { width, height, margin, padding } = INSET_SIZE
  const projection = chinaProjection().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    INSET_REGION,
  )
  const path = geoPath(projection)

  const inRegion = collection.features.filter((f) => {
    const [[west, south], [east, north]] = geoBounds(f)
    return (
      east >= INSET_BOUNDS.west &&
      west <= INSET_BOUNDS.east &&
      north >= INSET_BOUNDS.south &&
      south <= INSET_BOUNDS.north
    )
  })
  const adcodes = new Set(inRegion.map((f) => f.properties.adcode))
  const subset: CitiesCollection = {
    type: 'GeometryCollection',
    geometries: topology.objects.cities.geometries.filter((g) =>
      adcodes.has(cityPropertiesOf(g)?.adcode ?? ''),
    ),
  }

  return {
    x: mapWidth - width - margin,
    y: mapHeight - height - margin,
    width,
    height,
    landD: path({ type: 'FeatureCollection', features: inRegion }) ?? '',
    bordersD: path(mesh(topology, subset, isMajorBorder)) ?? '',
    dashLineD: path(feature(topology, topology.objects.dashLine)) ?? '',
  }
}
