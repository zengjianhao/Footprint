import { memo } from 'react'
import type { MapUnit } from '../geo/types'

interface UnitLayerProps {
  units: readonly MapUnit[]
  /** 已去过的单元 key；样式上与未去过的明显区分 */
  visitedIds: ReadonlySet<string>
}

/**
 * 单元填充层，也是唯一的指针目标。
 * memo 化：悬停与 tooltip 变化时不重渲染这几百个 path。
 */
export const UnitLayer = memo(function UnitLayer({ units, visitedIds }: UnitLayerProps) {
  return (
    <g className="units">
      {units.map((unit) => (
        <path
          key={unit.key}
          d={unit.d}
          data-id={unit.key}
          className={visitedIds.has(unit.key) ? 'unit visited' : 'unit'}
        />
      ))}
    </g>
  )
})
