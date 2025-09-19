import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://localhost:8000'
  const apiKey = env.MY_API_KEY || env.VITE_API_KEY || env.BACKEND_API_KEY || env.API_KEY

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
          headers: apiKey ? { 'x-api-key': apiKey } : undefined,
          configure: (proxy) => {
            if (!proxy || !apiKey) return
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', apiKey)
            })
          }
        }
      }
    }
  }
})