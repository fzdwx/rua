import { defineConfig } from 'vite'





export default defineConfig({
  plugins: [],
  base: './',  // 使用相对路径，确保 ext:// protocol 能正确加载
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        init: 'src/init.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
