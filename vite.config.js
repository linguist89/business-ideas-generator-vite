import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// This is used to group dependencies by package
function packageName(id) {
  let match = id.match(/([^\/\\]+)\/?$/)
  if (match) return match[1]
  return id
}

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return packageName(id)
          }
        },
      },
    },
  },
})