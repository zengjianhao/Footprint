import { getName, registerLocale } from 'i18n-iso-countries'
import zh from 'i18n-iso-countries/langs/zh.json'

registerLocale(zh)

/**
 * 按英文名覆盖的中文名：
 * - 数据集中没有 ISO 编码、无法查表的要素
 * - 需要修正译名的个别要素
 */
const NAME_OVERRIDES_BY_NAME: Readonly<Record<string, string>> = {
  Somaliland: '索马里兰',
  Kosovo: '科索沃',
  'N. Cyprus': '北塞浦路斯',
  'Indian Ocean Ter.': '印度洋领地',
  'Siachen Glacier': '锡亚琴冰川',
  'Ashmore and Cartier Is.': '阿什莫尔和卡捷群岛',
}

/** 中文优先，英文兜底 */
export function resolveCountryName(nameEn: string, isoNumeric?: string): string {
  const override = NAME_OVERRIDES_BY_NAME[nameEn]
  if (override !== undefined) return override
  if (isoNumeric !== undefined) {
    const zhName = getName(isoNumeric, 'zh')
    if (zhName) return zhName
  }
  return nameEn
}
