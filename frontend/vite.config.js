import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/'
  const normalizedBase = basePath.startsWith('/') && !basePath.endsWith('/') ? `${basePath}/` : basePath

  return {
    plugins: [react()],
    base: normalizedBase,
  }
})
