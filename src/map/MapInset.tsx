import { useId } from 'react'
import type { InsetModel } from '../geo/types'

interface MapInsetProps {
  inset: InsetModel
}

/** 附图：固定在主图右下角，不参与缩放与悬停 */
export function MapInset({ inset }: MapInsetProps) {
  const clipId = useId()
  const { x, y, width, height, label, landD, bordersD, decorationD } = inset
  return (
    <g className="inset" transform={`translate(${x},${y})`} pointerEvents="none">
      <clipPath id={clipId}>
        <rect width={width} height={height} />
      </clipPath>
      <rect className="inset__frame" width={width} height={height} />
      <g clipPath={`url(#${clipId})`}>
        <path className="inset__land" d={landD} />
        <path className="inset__borders" d={bordersD} />
        {decorationD && <path className="decoration decoration--dash-line" d={decorationD} />}
      </g>
      <text className="inset__label" x={6} y={height - 6}>
        {label}
      </text>
    </g>
  )
}
