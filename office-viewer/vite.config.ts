import { defineConfig } from 'vite';
import { fileViewerRenderers } from '@file-viewer/vite-plugin';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    fileViewerRenderers({
      formats: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
      copyAssets: true,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'Docxion',
      fileName: (format) => `index.${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        globals: {},
        manualChunks: undefined,
        codeSplitting: false,
      },
    },
    cssCodeSplit: false,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  
        passes: 2,           
      },
      mangle: true,          
    },
  },
  define: {
    // Polyfill import.meta.url with the page's location
    'import.meta.url': 'globalThis.location.href',
  },
  server: {
    open: '/src/dev/index.html',
  },
});