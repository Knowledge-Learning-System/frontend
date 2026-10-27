import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      // 无本地后端时，可指向生产服务器（nginx 反代 8080）用真实数据验证
      // 本地起后端调试时改回 http://localhost:8080
      '/api': {
        target: 'http://47.98.101.99:80',
        changeOrigin: true,
      },
    },
  },
})
