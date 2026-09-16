import { memo } from 'react'
import type { Country } from '../geo/types'

interface CountryLayerProps {
  countries: Country[]
  /** 已去过的国家 key；样式上与未去过的国家明显区分 */
  visitedIds: ReadonlySet<string>
}

/**
 * 国家填充层，也是唯一的指针目标。
 * memo 化：悬停与 tooltip 变化时不重渲染这 240 个 path。
 */
export const CountryLayer = memo(function CountryLayer({ countries, visitedIds }: CountryLayerProps) {
  return (
    <g className="countries">
      {countries.map((country) => (
        <path
          key={country.key}
          d={country.d}
          data-id={country.key}
          className={visitedIds.has(country.key) ? 'country visited' : 'country'}
        />
      ))}
    </g>
  )
})
