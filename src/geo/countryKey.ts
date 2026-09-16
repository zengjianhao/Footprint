import type { CountryFeature } from './types'

/**
 * 数据集里的特例（按英文名匹配）：
 * Ashmore and Cartier Is. 与 Australia 共用 ISO 编码 "036"，必须另起一个 key，
 * 否则两者在 byKey / React key 中会互相覆盖。
 */
const KEY_OVERRIDES_BY_NAME: Readonly<Record<string, string>> = {
  'Ashmore and Cartier Is.': 'name:Ashmore and Cartier Is.',
}

export interface CountryIdentity {
  key: string
  isoNumeric?: string
}

/** 从要素推导稳定 key 与 ISO 数字编码 */
export function identifyCountry(feature: CountryFeature): CountryIdentity {
  const nameEn = feature.properties.name
  const override = KEY_OVERRIDES_BY_NAME[nameEn]
  if (override !== undefined) return { key: override }
  if (feature.id != null) {
    const isoNumeric = String(feature.id)
    return { key: isoNumeric, isoNumeric }
  }
  return { key: `name:${nameEn}` }
}
