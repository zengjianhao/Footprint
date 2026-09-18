import { feature, mesh } from 'topojson-client'
import type { GeometryObject } from 'topojson-specification'
import { indexByKey } from './indexByKey'
import { boundsPolygon, buildInsetContent, intersectsBounds, layoutInset } from './inset'
import type { InsetSize, LonLatBounds } from './inset'
import { createJapanProjection, japanProjection } from './projection'
import type {
  JapanModel,
  JapanTopology,
  Prefecture,
  PrefectureFeatureCollection,
  PrefectureProperties,
  PrefecturesCollection,
} from './types'

/**
 * 主图按固定范围拟合本土四岛（含北海道东部诸岛与伊豆诸岛北部）；
 * 冲绳与鹿儿岛的奄美群岛交给南西诸岛附图，东京的小笠原群岛等远岛不显示。
 */
const MAIN_REGION: LonLatBounds = { west: 128.6, south: 30.2, east: 149, north: 45.7 }
/** 南西诸岛附图覆盖的经纬度范围：八重山、冲绳本岛到奄美群岛 */
const INSET_REGION: LonLatBounds = { west: 122.5, south: 23.7, east: 131.8, north: 29.6 }
const INSET_SIZE: InsetSize = { width: 200, height: 140, margin: 12, padding: 6, gap: 8 }

function prefecturePropertiesOf(geometry: GeometryObject): PrefectureProperties | undefined {
  return geometry.properties as PrefectureProperties | undefined
}

/** 把生成的日本都道府县 TopoJSON 转成可直接渲染的模型 */
export function buildJapan(topology: JapanTopology): JapanModel {
  const prefecturesObject = topology.objects.prefectures
  const collection: PrefectureFeatureCollection = feature(topology, prefecturesObject)
  const fitted = createJapanProjection(boundsPolygon(MAIN_REGION))
  const { projection, path, width } = fitted

  const units: Prefecture[] = collection.features.map((f) => {
    const p = f.properties
    return {
      key: p.code,
      name: p.name,
      subtitle: `${p.nameJa} · ${p.region}地方`,
      code: p.code,
      nameJa: p.nameJa,
      region: p.region,
      feature: f,
      d: path(f) ?? '',
    }
  })

  // 都道府县之间用细线，海岸线用粗线
  const minor = mesh(topology, prefecturesObject, (a, b) => a !== b)
  const major = mesh(topology, prefecturesObject, (a, b) => a === b)

  const layout = layoutInset(path, collection.features, [], width, fitted.height, INSET_SIZE)
  const insetLand = collection.features.filter((f) => intersectsBounds(f, INSET_REGION))
  const insetCodes = new Set(insetLand.map((f) => f.properties.code))
  const insetSubset: PrefecturesCollection = {
    type: 'GeometryCollection',
    geometries: prefecturesObject.geometries.filter((g) =>
      insetCodes.has(prefecturePropertiesOf(g)?.code ?? ''),
    ),
  }

  return {
    units,
    byKey: indexByKey(units),
    borders: [
      { d: path(minor) ?? '', kind: 'minor' },
      { d: path(major) ?? '', kind: 'major' },
    ],
    inset: buildInsetContent(
      {
        projection: japanProjection(),
        region: INSET_REGION,
        size: INSET_SIZE,
        label: '南西诸岛',
        land: insetLand,
        borders: mesh(topology, insetSubset),
      },
      layout,
    ),
    width,
    height: layout.height,
    projection,
    path,
  }
}
