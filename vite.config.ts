import { defineConfig } from 'vite';
import { fileViewerRenderers } from '@file-viewer/vite-plugin';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    fileViewerRenderers({
      formats: [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
      ],
      copyAssets: true,
      chunkStrategy: 'renderer',
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'FileViewer',
      fileName: (format) => `index.${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: false,
      },
    },
  },
  // Development server
  server: {
    open: '/src/dev/index.html',
  },
});