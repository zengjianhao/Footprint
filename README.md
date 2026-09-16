# Footprint

记录去过的国家和城市的可交互地图。

## 开发

```bash
npm install
npm run dev      # 本地开发
npm run build    # 类型检查 + 打包
npm run lint     # oxlint
```

## 技术栈

- Vite + React 19 + TypeScript
- d3-geo（Equal Earth 投影）、d3-zoom / d3-selection（缩放拖拽）、topojson-client
- 地图数据：world-atlas `countries-50m.json`（作为独立静态资源按需加载）
- 中文国名：i18n-iso-countries，仅注册 zh 语言包

## 目录

```
src/data   地图数据加载（loadWorld / useWorld）
src/geo    地理模型：类型、投影、国家 key 与名称、buildWorld
src/map    地图组件：WorldMap、CountryLayer、Tooltip、useZoom
src/styles 全局样式与颜色变量
```
