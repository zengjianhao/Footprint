import { useId } from 'react'
import type { InsetModel } from '../geo/types'

interface SouthChinaSeaInsetProps {
  inset: InsetModel
}

/** 南海诸岛附图：固定在主图右下角，不参与缩放与悬停 */
export function SouthChinaSeaInset({ inset }: SouthChinaSeaInsetProps) {
  const clipId = useId()
  const { x, y, width, height, landD, bordersD, dashLineD } = inset
  return (
    <g className="inset" transform={`translate(${x},${y})`} pointerEvents="none">
      <clipPath id={clipId}>
        <rect width={width} height={height} />
      </clipPath>
      <rect className="inset__frame" width={width} height={height} />
      <g clipPath={`url(#${clipId})`}>
        <path className="inset__land" d={landD} />
        <path className="inset__borders" d={bordersD} />
        <path className="decoration decoration--dash-line" d={dashLineD} />
      </g>
      <text className="inset__label" x={6} y={height - 6}>
        南海诸岛
      </text>
    </g>
  )
}
