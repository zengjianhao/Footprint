import type { Ref } from 'react'

interface TooltipProps {
  ref: Ref<HTMLDivElement>
  name: string | null
  subtitle?: string
}

/** 跟随光标的名称标签；位置由父组件直接写 style.transform，避免每次移动都重渲染 */
export function Tooltip({ ref, name, subtitle }: TooltipProps) {
  return (
    <div ref={ref} className="tooltip" role="status" hidden={name === null}>
      <div className="tooltip__name">{name}</div>
      {subtitle && <div className="tooltip__subtitle">{subtitle}</div>}
    </div>
  )
}
