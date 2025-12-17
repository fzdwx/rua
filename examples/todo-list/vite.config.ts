import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'




export default defineConfig({
  plugins: [react()],
  base: './',  // 使用相对路径，确保 ext:// protocol 能正确加载
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
