import { feature, mesh } from 'topojson-client'
import type { GeometryObject } from 'topojson-specification'
import { indexByKey } from './indexByKey'
import { buildInsetContent, intersectsBounds, layoutInset, polygonsOf } from './inset'
import type { InsetSize, LonLatBounds } from './inset'
import { chinaProjection, createChinaProjection } from './projection'
import type {
  ChinaModel,
  ChinaTopology,
  CitiesCollection,
  City,
  CityFeature,
  CityFeatureCollection,
  CityProperties,
} from './types'

/** 三沙市：辖区在南海深处，主图拟合时排除，由南海诸岛附图呈现 */
const SANSHA_ADCODE = '460300'

/** 南海诸岛附图覆盖的经纬度范围 */
const INSET_REGION: LonLatBounds = { west: 106, south: 2, east: 124, north: 24 }
const INSET_SIZE: InsetSize = { width: 140, height: 176, margin: 12, padding: 6, gap: 8 }

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

/** 由去过的市推导世界地图上应点亮的要素 key（数据集把台湾、香港、澳门画成独立要素） */
export function chinaVisitedCountryKeys(visitedCities: ReadonlySet<string>): string[] {
  const prefixToKey: Readonly<Record<string, string>> = { '71': '158', '81': '344', '82': '446' }
  const keys = new Set<string>()
  for (const adcode of visitedCities) keys.add(prefixToKey[adcode.slice(0, 2)] ?? '156')
  return [...keys]
}

/** 把生成的中国市级 TopoJSON 转成可直接渲染的模型 */
export function buildChina(topology: ChinaTopology): ChinaModel {
  const citiesObject = topology.objects.cities
  const collection: CityFeatureCollection = feature(topology, citiesObject)
  const mainland: CityFeature[] = collection.features.filter(
    (f) => f.properties.adcode !== SANSHA_ADCODE,
  )
  const fitted = createChinaProjection({ type: 'FeatureCollection', features: mainland })
  const { projection, path, width } = fitted

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

  const layout = layoutInset(
    path,
    mainland,
    dashLine.features.flatMap((f) => polygonsOf(f.geometry)),
    width,
    fitted.height,
    INSET_SIZE,
  )
  const insetLand = collection.features.filter((f) => intersectsBounds(f, INSET_REGION))
  const insetCodes = new Set(insetLand.map((f) => f.properties.adcode))
  const insetSubset: CitiesCollection = {
    type: 'GeometryCollection',
    geometries: citiesObject.geometries.filter((g) =>
      insetCodes.has(cityPropertiesOf(g)?.adcode ?? ''),
    ),
  }

  return {
    units,
    byKey: indexByKey(units),
    borders: [
      { d: path(minor) ?? '', kind: 'minor' },
      { d: path(major) ?? '', kind: 'major' },
    ],
    decorations: [{ d: path(dashLine) ?? '', kind: 'dash-line' }],
    inset: buildInsetContent(
      {
        projection: chinaProjection(),
        region: INSET_REGION,
        size: INSET_SIZE,
        label: '南海诸岛',
        land: insetLand,
        borders: mesh(topology, insetSubset, isMajorBorder),
        decoration: dashLine,
      },
      layout,
    ),
    width,
    height: layout.height,
    projection,
    path,
  }
}
