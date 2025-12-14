import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        init: 'src/init.ts',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
      },
    },
  },
});
