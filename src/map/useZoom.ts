import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { select } from 'd3-selection'
import { zoom } from 'd3-zoom'
import type { D3ZoomEvent } from 'd3-zoom'

export const MIN_SCALE = 1
/** 世界地图的默认上限：梵蒂冈在 viewBox 中约 0.02 单位宽，400× 下约 8px，足够悬停 */
export const DEFAULT_MAX_SCALE = 400

export type ZoomEvent = D3ZoomEvent<SVGSVGElement, unknown>

interface UseZoomOptions {
  svgRef: RefObject<SVGSVGElement | null>
  groupRef: RefObject<SVGGElement | null>
  /** viewBox 尺寸，用来约束平移范围 */
  width: number
  height: number
  maxScale?: number
  onZoom?: (event: ZoomEvent) => void
}

/**
 * 把 d3-zoom 挂到 svg 上，transform 直接写到被缩放的 <g>，不经过 React state。
 * 双击缩放被禁用，留给点击语义。
 */
export function useZoom({
  svgRef,
  groupRef,
  width,
  height,
  maxScale = DEFAULT_MAX_SCALE,
  onZoom,
}: UseZoomOptions): void {
  const onZoomRef = useRef(onZoom)
  useEffect(() => {
    onZoomRef.current = onZoom
  }, [onZoom])

  useEffect(() => {
    const svg = svgRef.current
    const group = groupRef.current
    if (!svg || !group) return

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, maxScale])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', (event: ZoomEvent) => {
        group.setAttribute('transform', event.transform.toString())
        // 放大后给 svg 打标记，静态覆盖层（如附图）据此淡出，不挡住被放大的内容
        svg.classList.toggle('geo-map__svg--zoomed', event.transform.k > 1.01)
        onZoomRef.current?.(event)
      })

    const selection = select(svg)
    selection.call(behavior).on('dblclick.zoom', null)

    return () => {
      // 移除 .zoom 命名空间下的全部监听；StrictMode 二次挂载时会重新绑定
      selection.on('.zoom', null)
    }
  }, [svgRef, groupRef, width, height, maxScale])
}
