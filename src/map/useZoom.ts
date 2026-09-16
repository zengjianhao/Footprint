import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { select } from 'd3-selection'
import { zoom } from 'd3-zoom'
import type { D3ZoomEvent } from 'd3-zoom'

export const MIN_SCALE = 1
/** 梵蒂冈在 viewBox 中约 0.02 单位宽，400× 下约 8px，足够悬停 */
export const MAX_SCALE = 400

export type ZoomEvent = D3ZoomEvent<SVGSVGElement, unknown>

interface UseZoomOptions {
  svgRef: RefObject<SVGSVGElement | null>
  groupRef: RefObject<SVGGElement | null>
  /** viewBox 尺寸，用来约束平移范围 */
  width: number
  height: number
  onZoom?: (event: ZoomEvent) => void
}

/**
 * 把 d3-zoom 挂到 svg 上，transform 直接写到被缩放的 <g>，不经过 React state。
 * 双击缩放被禁用，留给后续的点击语义。
 */
export function useZoom({ svgRef, groupRef, width, height, onZoom }: UseZoomOptions): void {
  const onZoomRef = useRef(onZoom)
  useEffect(() => {
    onZoomRef.current = onZoom
  }, [onZoom])

  useEffect(() => {
    const svg = svgRef.current
    const group = groupRef.current
    if (!svg || !group) return

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', (event: ZoomEvent) => {
        group.setAttribute('transform', event.transform.toString())
        onZoomRef.current?.(event)
      })

    const selection = select(svg)
    selection.call(behavior).on('dblclick.zoom', null)

    return () => {
      // 移除 .zoom 命名空间下的全部监听；StrictMode 二次挂载时会重新绑定
      selection.on('.zoom', null)
    }
  }, [svgRef, groupRef, width, height])
}
