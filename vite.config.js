import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// This is used to group dependencies by package
function packageName(id) {
  // match the package name from the path
  // this regex handles scoped packages and nested node_modules (e.g., node_modules/package/node_modules/another-package)
  let match = id.match(/[\\/]node_modules[\\/](?:(@[^\\/]+[\\/])?[^\\/]+)/);

  // the package name is the second group in the match array
  return match ? match[1] || match[2] : '';
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
