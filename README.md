# Footprint

记录去过的国家和城市的可交互地图。

## 开发

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 打包
npm run lint       # oxlint
npm run data:china # 重新生成中国市级边界数据（需要联网，平时不用跑）
```

## 功能

- 世界地图：Natural Earth 投影、太平洋居中；悬停显示中文国名，可缩放拖拽。
- 中国地图：点击世界地图上的中国进入；精确到市级行政区，省界比市界更粗；右下角有南海诸岛附图（主图向南留出空间，附图不遮挡台湾与沿海；放大主图时附图淡出）。`‹ 世界地图` 按钮或 Esc 返回。
- 「去过」样式（琥珀色）已预留，由 `visitedIds` 驱动，记录功能待做。

## 技术栈

- Vite + React 19 + TypeScript
- d3-geo（投影）、d3-zoom / d3-selection（缩放拖拽）、topojson-client
- 世界地图数据：world-atlas `countries-50m.json`（作为独立静态资源按需加载）
- 中文国名：i18n-iso-countries，仅注册 zh 语言包

## 数据

### 中国市级边界 `src/data/china/china-cities.json`

由 `scripts/build-china-data.mjs` 生成，来源为阿里云 [DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)（底层为高德 / 民政部行政区划数据）。生成规则：

- 各省 `{adcode}_full.json` 给出市级单元（含省直辖县级行政区），共 370 个单元
- 直辖市、港澳台没有市级层（台湾无子级数据），各作为一个单元
- 十段线单独保留；多边形按 d3-geo 的球面约定重绕（外环顺时针）
- TopoJSON 化后按球面三角形面积简化并重新量化，约 950 KB（gzip 320 KB），只在进入中国地图时加载

生成好的文件已提交进仓库，运行时不依赖外部服务。

## 目录

```
scripts/     数据生成脚本
src/data     地图数据加载（cachedLoader / useAsync）与生成的数据文件
src/geo      地理模型：类型、投影、国家 / 城市 key 与名称、buildWorld / buildChina
src/map      地图组件：GeoMap（通用）、WorldMap、ChinaMap、SouthChinaSeaInset、Tooltip、useZoom
src/styles   全局样式与颜色变量
```
