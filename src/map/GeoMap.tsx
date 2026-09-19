import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { MapModel, MapUnit } from '../geo/types'
import { MapInset } from './MapInset'
import { Tooltip } from './Tooltip'
import { UnitLayer } from './UnitLayer'
import { useZoom } from './useZoom'
import type { ZoomEvent } from './useZoom'
import './map.css'

interface GeoMapProps<U extends MapUnit> {
  model: MapModel<U>
  visitedIds: ReadonlySet<string>
  onUnitClick?: (unit: U) => void
  /** 最大缩放倍率；默认取世界地图所需的 400× */
  maxScale?: number
  /** 无障碍名称 */
  label: string
  /** 其他不随地图缩放的静态覆盖层（viewBox 坐标） */
  children?: ReactNode
}

const TOOLTIP_OFFSET = 14
const VIEWPORT_MARGIN = 8

/** 事件目标（或命中测试结果）对应的单元 key；海洋、边界线上为 null */
function unitKeyOf(target: EventTarget | Element | null): string | null {
  return target instanceof Element ? target.getAttribute('data-id') : null
}

/**
 * 通用的可缩放地图：填充层 + 边界层 + 悬停描边 + 跟随光标的名称标签 + 可选附图。
 * 世界地图与各国精细地图共用；差异全部由 model 描述。
 * 附图里的单元与主图单元同 key，悬停 / 点击通过同一套事件委托处理。
 */
export function GeoMap<U extends MapUnit>({
  model,
  visitedIds,
  onUnitClick,
  maxScale,
  label,
  children,
}: GeoMapProps<U>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const hovered = hoveredKey === null ? null : (model.byKey.get(hoveredKey) ?? null)

  const moveTooltip = useCallback((clientX: number, clientY: number) => {
    const el = tooltipRef.current
    if (!el) return
    let x = clientX + TOOLTIP_OFFSET
    let y = clientY + TOOLTIP_OFFSET
    // 贴近右/下边缘时翻到光标另一侧
    if (x + el.offsetWidth > window.innerWidth - VIEWPORT_MARGIN) {
      x = clientX - TOOLTIP_OFFSET - el.offsetWidth
    }
    if (y + el.offsetHeight > window.innerHeight - VIEWPORT_MARGIN) {
      y = clientY - TOOLTIP_OFFSET - el.offsetHeight
    }
    el.style.transform = `translate(${x}px, ${y}px)`
  }, [])

  // tooltip 刚出现或换了单元时尺寸会变（隐藏时量不到宽度）：DOM 更新后、绘制前按最新尺寸重新定位
  useLayoutEffect(() => {
    const pointer = lastPointerRef.current
    if (hovered && pointer) moveTooltip(pointer.x, pointer.y)
  }, [hovered, moveTooltip])

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      setHoveredKey(unitKeyOf(event.target))
      moveTooltip(event.clientX, event.clientY)
    },
    [moveTooltip],
  )

  const handlePointerLeave = useCallback(() => {
    setHoveredKey(null)
  }, [])

  const handleClick = useCallback(
    (event: ReactMouseEvent<SVGSVGElement>) => {
      const key = unitKeyOf(event.target)
      const unit = key === null ? undefined : model.byKey.get(key)
      if (unit) onUnitClick?.(unit)
    },
    [model, onUnitClick],
  )

  // 滚轮缩放时光标不动，但光标下的单元可能变化：等 transform 生效后重新命中测试
  const handleZoom = useCallback((event: ZoomEvent) => {
    const source: unknown = event.sourceEvent
    if (!(source instanceof WheelEvent)) return
    const { clientX, clientY } = source
    requestAnimationFrame(() => {
      setHoveredKey(unitKeyOf(document.elementFromPoint(clientX, clientY)))
    })
  }, [])

  useZoom({
    svgRef,
    groupRef,
    width: model.width,
    height: model.height,
    maxScale,
    onZoom: handleZoom,
  })

  return (
    <div className="geo-map">
      <svg
        ref={svgRef}
        className="geo-map__svg"
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-label={label}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <g ref={groupRef}>
          <UnitLayer units={model.units} visitedIds={visitedIds} />
          {model.borders.map((layer) => (
            <path
              key={layer.kind}
              className={`borders borders--${layer.kind}`}
              d={layer.d}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {model.decorations?.map((layer, index) => (
            <path
              key={index}
              className={`decoration decoration--${layer.kind}`}
              d={layer.d}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {hovered && (
            <path className="hover-outline" d={hovered.d} vectorEffect="non-scaling-stroke" />
          )}
        </g>
        {model.inset && (
          <MapInset inset={model.inset} visitedIds={visitedIds} hoveredKey={hoveredKey} />
        )}
        {children}
      </svg>
      <Tooltip
        ref={tooltipRef}
        name={hovered?.name ?? null}
        subtitle={hovered?.subtitle}
        visited={hovered !== null && visitedIds.has(hovered.key)}
      />
    </div>
  )
}
