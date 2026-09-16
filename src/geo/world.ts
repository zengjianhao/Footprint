import { feature, mesh } from 'topojson-client'
import { identifyCountry } from './countryKey'
import { resolveCountryName } from './names'
import { createProjection } from './projection'
import type {
  CountriesCollection,
  Country,
  CountryFeatureCollection,
  WorldModel,
  WorldTopology,
} from './types'

/** 南极洲的 ISO 3166-1 数字编码：不渲染，也不参与投影拟合 */
const ANTARCTICA_ID = '010'

/** 把 TopoJSON 转成可直接渲染的世界模型 */
export function buildWorld(topology: WorldTopology): WorldModel {
  const countriesObject: CountriesCollection = {
    type: 'GeometryCollection',
    geometries: topology.objects.countries.geometries.filter((g) => g.id !== ANTARCTICA_ID),
  }

  const collection: CountryFeatureCollection = feature(topology, countriesObject)
  const { projection, path, width, height } = createProjection(collection)

  const countries: Country[] = collection.features.map((f) => {
    const { key, isoNumeric } = identifyCountry(f)
    const nameEn = f.properties.name
    return {
      key,
      isoNumeric,
      nameEn,
      name: resolveCountryName(nameEn, isoNumeric),
      feature: f,
      d: path(f) ?? '',
    }
  })

  const byKey = new Map<string, Country>()
  for (const country of countries) {
    const existing = byKey.get(country.key)
    if (existing) {
      throw new Error(
        `Duplicate country key "${country.key}": ${existing.nameEn} / ${country.nameEn}`,
      )
    }
    byKey.set(country.key, country)
  }

  // 只取相邻国家之间的共享边界，一条路径画完，避免相邻填充重复描边
  const borders = mesh(topology, countriesObject, (a, b) => a !== b)

  return {
    countries,
    byKey,
    bordersD: path(borders) ?? '',
    width,
    height,
    projection,
    path,
  }
}
