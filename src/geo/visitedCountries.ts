/** 市级行政区划代码前缀 → 世界地图上的要素 key（数据集把台湾、香港、澳门画成独立要素） */
const PREFIX_TO_COUNTRY_KEY: Readonly<Record<string, string>> = {
  '71': '158',
  '81': '344',
  '82': '446',
}
const MAINLAND_KEY = '156'

/** 由去过的市推导世界地图上应点亮的要素 */
export function deriveVisitedCountries(cities: ReadonlySet<string>): ReadonlySet<string> {
  const countries = new Set<string>()
  for (const adcode of cities) {
    countries.add(PREFIX_TO_COUNTRY_KEY[adcode.slice(0, 2)] ?? MAINLAND_KEY)
  }
  return countries
}
