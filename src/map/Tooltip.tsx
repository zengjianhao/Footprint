import type { Ref } from 'react'

interface TooltipProps {
  ref: Ref<HTMLDivElement>
  name: string | null
}

/** 跟随光标的国名标签；位置由父组件直接写 style.transform，避免每次移动都重渲染 */
export function Tooltip({ ref, name }: TooltipProps) {
  return (
    <div ref={ref} className="tooltip" role="status" hidden={name === null}>
      {name}
    </div>
  )
}
