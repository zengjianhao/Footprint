import type { Ref } from 'react'

interface TooltipProps {
  ref: Ref<HTMLDivElement>
  name: string | null
  subtitle?: string
  /** 告诉用户此刻点击会发生什么 */
  hint?: string
  visited?: boolean
}

/** 跟随光标的名称标签；位置由父组件直接写 style.transform，避免每次移动都重渲染 */
export function Tooltip({ ref, name, subtitle, hint, visited = false }: TooltipProps) {
  return (
    <div ref={ref} className="tooltip" role="status" hidden={name === null}>
      <div className="tooltip__name">
        {name}
        {visited && <span className="tooltip__badge">已去过</span>}
      </div>
      {subtitle && <div className="tooltip__subtitle">{subtitle}</div>}
      {hint && <div className="tooltip__hint">{hint}</div>}
    </div>
  )
}
