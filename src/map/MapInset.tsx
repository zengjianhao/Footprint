import { useId } from 'react'
import type { InsetModel } from '../geo/types'

interface MapInsetProps {
  inset: InsetModel
  visitedIds: ReadonlySet<string>
  hoveredKey: string | null
}

/**
 * 附图：固定在主图右下角，不参与缩放，放大主图时淡出。
 * 单元分两层绘制：下层是透明的粗描边，只用来扩大小岛的命中范围；上层是真正的填充。
 * 填充在上，所以陆地上的命中仍然精确，只有海面上才落到描边。
 */
export function MapInset({ inset, visitedIds, hoveredKey }: MapInsetProps) {
  const clipId = useId()
  const { x, y, width, height, label, units, bordersD, decorationD } = inset
  const hovered = hoveredKey === null ? undefined : units.find((unit) => unit.key === hoveredKey)
  return (
    <g className="inset" transform={`translate(${x},${y})`}>
      <clipPath id={clipId}>
        <rect width={width} height={height} />
      </clipPath>
      <rect className="inset__frame" width={width} height={height} />
      <g clipPath={`url(#${clipId})`}>
        <g className="inset__hits">
          {units.map((unit) => (
            <path key={unit.key} className="inset__hit" d={unit.d} data-id={unit.key} />
          ))}
        </g>
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
        <path className="inset__borders" d={bordersD} />
        {decorationD && <path className="decoration decoration--dash-line" d={decorationD} />}
        {hovered && <path className="hover-outline" d={hovered.d} />}
      </g>
      <text className="inset__label" x={6} y={height - 6}>
        {label}
      </text>
    </g>
  )
}
