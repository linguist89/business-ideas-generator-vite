import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    {
      ...visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
      enforce: 'post',
      apply: 'build',
    },
  ],
  build: {
    chunkSizeWarningLimit: 750, // size in KiB
  },
})
