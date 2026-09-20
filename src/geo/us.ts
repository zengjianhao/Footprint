import { feature, mesh } from 'topojson-client'
import { indexByKey } from './indexByKey'
import { createUsProjection } from './projection'
import type { State, StateFeatureCollection, UsModel, UsTopology } from './types'

/** 把生成的美国州级 TopoJSON 转成可直接渲染的模型 */
export function buildUs(topology: UsTopology): UsModel {
  const statesObject = topology.objects.states
  const collection: StateFeatureCollection = feature(topology, statesObject)
  const { projection, path, width, height } = createUsProjection(collection)

  const units: State[] = collection.features.map((f) => {
    const p = f.properties
    return {
      key: p.code,
      name: p.name,
      subtitle: `${p.nameEn} (${p.abbr}) · ${p.region}`,
      code: p.code,
      abbr: p.abbr,
      nameEn: p.nameEn,
      region: p.region,
      feature: f,
      d: path(f) ?? '',
    }
  })

  // 州界用细线，海岸线与国界用粗线
  const minor = mesh(topology, statesObject, (a, b) => a !== b)
  const major = mesh(topology, statesObject, (a, b) => a === b)

  return {
    units,
    byKey: indexByKey(units),
    borders: [
      { d: path(minor) ?? '', kind: 'minor' },
      { d: path(major) ?? '', kind: 'major' },
    ],
    width,
    height,
    projection,
    path,
  }
}
