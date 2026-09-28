import { useState } from 'react'
import type { RefObject } from 'react'
import { saveMapImage } from './saveMapImage'

interface SaveImageButtonProps {
  svgRef: RefObject<SVGSVGElement | null>
  /** 用于文件名，如「世界地图」「中国地图」 */
  mapName: string
}

type Status = 'idle' | 'saving' | 'failed'

const LABELS: Record<Status, string> = {
  idle: '保存图片',
  saving: '正在保存…',
  failed: '保存失败，重试',
}

/** 右上角的「保存图片」：把当前这张地图连同已去过的标记保存为 PNG */
export function SaveImageButton({ svgRef, mapName }: SaveImageButtonProps) {
  const [status, setStatus] = useState<Status>('idle')

  const handleClick = async () => {
    const svg = svgRef.current
    if (!svg) return
    setStatus('saving')
    try {
      await saveMapImage(svg, mapName)
      setStatus('idle')
    } catch (error) {
      console.error(error)
      setStatus('failed')
    }
  }

  return (
    <div className="map-actions">
      <button
        type="button"
        className="nav__button"
        disabled={status === 'saving'}
        onClick={handleClick}
      >
        {LABELS[status]}
      </button>
    </div>
  )
}
