import globalCss from '../styles/global.css?inline'
import mapCss from './map.css?inline'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** 导出图的线宽按这个宽度（CSS px）的屏幕来定 */
const REFERENCE_WIDTH = 1600
/** 输出像素倍率：导出图宽 1600 × 2 = 3200px */
const PIXEL_RATIO = 2

/**
 * 把地图渲染成 PNG：总是完整地图，忽略当前的缩放平移；附图照常画出，不含悬停描边。
 * 样式用与页面相同的两份样式表，嵌进 SVG 后交给浏览器栅格化。
 */
async function renderMapPng(svg: SVGSVGElement): Promise<Blob> {
  const { width: viewWidth, height: viewHeight } = svg.viewBox.baseVal
  const pixelWidth = REFERENCE_WIDTH * PIXEL_RATIO
  const pixelHeight = Math.round((pixelWidth * viewHeight) / viewWidth)

  const clone = svg.cloneNode(true) as SVGSVGElement
  // non-scaling-stroke 的线宽按图片自身像素计，高分辨率导出时会细得看不清：换算成 viewBox 单位
  const unitsPerPx = viewWidth / REFERENCE_WIDTH
  const originals = svg.querySelectorAll<SVGElement>('[vector-effect]')
  clone.querySelectorAll<SVGElement>('[vector-effect]').forEach((copy, index) => {
    const strokeWidth = Number.parseFloat(getComputedStyle(originals[index]).strokeWidth)
    copy.removeAttribute('vector-effect')
    copy.style.setProperty('stroke-width', `${strokeWidth * unitsPerPx}px`)
  })
  clone.querySelectorAll('.hover-outline').forEach((el) => el.remove())
  clone.querySelector('.geo-map__viewport')?.removeAttribute('transform')
  // .geo-map__svg 的 100% 宽高会盖过下面的像素尺寸，--zoomed 会隐藏附图
  clone.removeAttribute('class')
  clone.setAttribute('width', String(pixelWidth))
  clone.setAttribute('height', String(pixelHeight))
  const style = document.createElementNS(SVG_NS, 'style')
  style.textContent = globalCss + mapCss
  clone.prepend(style)

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml',
  })
  const svgUrl = URL.createObjectURL(svgBlob)
  try {
    const image = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持 canvas 2D')
    context.fillStyle = getComputedStyle(svg).backgroundColor
    context.fillRect(0, 0, pixelWidth, pixelHeight)
    context.drawImage(image, 0, 0, pixelWidth, pixelHeight)
    return await canvasToPng(canvas)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('地图 SVG 无法解码为图片'))
    image.src = url
  })
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG 编码失败'))), 'image/png')
  })
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // 下载在 click 之后才异步开始，立即释放 URL 会让部分浏览器下载失败
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function dateStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 保存为「足迹-中国地图-2026-09-28.png」这样的文件 */
export async function saveMapImage(svg: SVGSVGElement, mapName: string): Promise<void> {
  const png = await renderMapPng(svg)
  downloadBlob(png, `足迹-${mapName}-${dateStamp(new Date())}.png`)
}
