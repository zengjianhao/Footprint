import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { Country, WorldModel } from '../geo/types'
import { CountryLayer } from './CountryLayer'
import { Tooltip } from './Tooltip'
import { useZoom } from './useZoom'
import type { ZoomEvent } from './useZoom'
import './map.css'

interface WorldMapProps {
  world: WorldModel
  visitedIds: ReadonlySet<string>
  onCountryClick?: (country: Country) => void
}

const TOOLTIP_OFFSET = 14
const VIEWPORT_MARGIN = 8

/** 事件目标（或命中测试结果）对应的国家 key；海洋、边界线上为 null */
function countryKeyOf(target: EventTarget | Element | null): string | null {
  return target instanceof Element ? target.getAttribute('data-id') : null
}

export function WorldMap({ world, visitedIds, onCountryClick }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const hovered = hoveredKey === null ? null : (world.byKey.get(hoveredKey) ?? null)

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

  // tooltip 刚出现或换了国家时尺寸会变（隐藏时量不到宽度）：DOM 更新后、绘制前按最新尺寸重新定位
  useLayoutEffect(() => {
    const pointer = lastPointerRef.current
    if (hovered && pointer) moveTooltip(pointer.x, pointer.y)
  }, [hovered, moveTooltip])

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      setHoveredKey(countryKeyOf(event.target))
      moveTooltip(event.clientX, event.clientY)
    },
    [moveTooltip],
  )

  const handlePointerLeave = useCallback(() => {
    setHoveredKey(null)
  }, [])

  const handleClick = useCallback(
    (event: ReactMouseEvent<SVGSVGElement>) => {
      const key = countryKeyOf(event.target)
      const country = key === null ? undefined : world.byKey.get(key)
      if (country) onCountryClick?.(country)
    },
    [world, onCountryClick],
  )

  // 滚轮缩放时光标不动，但光标下的国家可能变化：等 transform 生效后重新命中测试
  const handleZoom = useCallback((event: ZoomEvent) => {
    const source: unknown = event.sourceEvent
    if (!(source instanceof WheelEvent)) return
    const { clientX, clientY } = source
    requestAnimationFrame(() => {
      setHoveredKey(countryKeyOf(document.elementFromPoint(clientX, clientY)))
    })
  }, [])

  useZoom({ svgRef, groupRef, width: world.width, height: world.height, onZoom: handleZoom })

  return (
    <div className="world-map">
      <svg
        ref={svgRef}
        className="world-map__svg"
        viewBox={`0 0 ${world.width} ${world.height}`}
        role="img"
        aria-label="世界地图"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <g ref={groupRef}>
          <CountryLayer countries={world.countries} visitedIds={visitedIds} />
          <path className="borders" d={world.bordersD} vectorEffect="non-scaling-stroke" />
          {hovered && (
            <path className="hover-outline" d={hovered.d} vectorEffect="non-scaling-stroke" />
          )}
        </g>
      </svg>
      <Tooltip ref={tooltipRef} name={hovered?.name ?? null} />
    </div>
  )
}
