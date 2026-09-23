import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 部署到 GitHub Pages 时站点在 /<仓库名>/ 子路径下，由 CI 传入 BASE_PATH；
  // 本地开发与预览仍用根路径。
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
