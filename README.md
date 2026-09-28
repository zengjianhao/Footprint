# Footprint

记录去过的国家和城市的可交互地图。

## 开发

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 打包
npm run lint       # oxlint
npm run data:china # 重新生成中国市级边界数据（需要联网，平时不用跑）
npm run data:japan # 重新生成日本都道府县边界数据（同上）
npm run data:us    # 重新生成美国州级边界数据（同上）
```

## 功能

- 世界地图：Natural Earth 投影、太平洋居中；悬停显示中文国名，可缩放拖拽。
- 世界地图：点击任何国家即标记「去过」，再点一次取消。左上角「精细地图」下方可进入中国 / 日本 / 美国的精细地图。
- 精细地图：中国精确到市级行政区，省界比市界更粗，右下角有南海诸岛附图；日本精确到都道府县，右下角有南西诸岛附图（冲绳与奄美）；美国精确到州（含哥伦比亚特区），阿拉斯加与夏威夷按 Albers USA 投影的惯例缩放后放在左下角。附图不遮挡主图要素，放大主图时淡出；附图里的单元同样可以悬停和标记（冲绳、奄美、三沙只出现在附图里，就在附图中点击）。`‹ 世界地图` 按钮或 Esc 返回。
- 记录足迹：点击即标记，再点一次取消，去过的单元显示为蓝色，悬停提示会说明这一下点下去会发生什么。在精细地图里标记一个单元时，它所属的国家也会在世界地图上点亮；反过来在世界地图上取消一个国家只是让它变灰，不会清空已标记的单元。记录保存在浏览器 localStorage（键 `footprint.visited.v3`，旧的 v1 / v2 会自动迁移，其中国家由已去过的单元推导补齐）。
- 新增国家：先在 `src/geo/types.ts` 的 `DetailCountryId` 里加上新国家 id，再在 `src/data/detailMaps.ts` 的注册表里加一项（该国在世界地图上的要素 key、数据加载、量词等），并提供对应的 `buildXxx` 模型与数据生成脚本。

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

### 日本都道府县 `src/data/japan/japan-prefectures.json`

由 `scripts/build-japan-data.mjs` 生成，来源为 [dataofjapan/land](https://github.com/dataofjapan/land) 的 `japan.topojson`，该文件由国土地理院「地球地図日本」的 Shapefile 转换而来（出典：地球地図日本（国土地理院））。47 个都道府县各为一个单元，key 为 ISO 3166-2 代码；附加中文名、日文名与所属地方。数据中北海道含北方四岛、东京含伊豆与小笠原群岛，按原样保留；主图只显示本土范围，冲绳与奄美在附图中，远岛不显示。约 320 KB（gzip 67 KB）。

### 美国州级 `src/data/us/us-states.json`

由 `scripts/build-us-data.mjs` 生成，来源为 [us-atlas](https://github.com/topojson/us-atlas) 的 `states-10m.json`，由美国人口普查局的 cartographic boundary 文件转换而来（公有领域）。50 个州 + 哥伦比亚特区各为一个单元，key 为 ISO 3166-2 代码；附加中文名、USPS 缩写与人口普查局四大区域。波多黎各等海外领地不在 Albers USA 投影范围内，已排除。约 112 KB（gzip 37 KB）。

三份生成好的文件都已提交进仓库，运行时不依赖外部服务。

## 目录

```
scripts/     数据生成脚本
src/data     数据加载（cachedLoader / useAsync）、精细地图注册表 detailMaps.ts、生成的数据文件
src/geo      地理模型：类型、投影、附图布局、buildWorld / buildChina / buildJapan / buildUs
src/map      地图组件：GeoMap（通用）、WorldMap、DetailMap、MapInset、Tooltip、useZoom
src/state    足迹记录（useVisited + localStorage 读写）
src/styles   全局样式与颜色变量
```

## 部署

推送到 `main` 后由 GitHub Actions 自动构建并发布到 GitHub Pages：
<https://zengjianhao.github.io/Footprint/>。

站点在仓库名子路径下，因此构建时由 CI 传入 `BASE_PATH`（见 `.github/workflows/deploy.yml`），
`vite.config.ts` 据此设置 `base`；本地开发与 `npm run preview` 仍用根路径，无需额外配置。

## 许可

代码以 [MIT](LICENSE) 许可发布。`src/data/` 下的地图数据来自第三方，各自遵循其原始许可，
使用或再分发时请保留上面「数据」一节中的出处说明；其中日本数据（地球地図日本，国土地理院）
非营利使用需注明出处，营利使用还需向著作权人报备。
