import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileViewerRenderers } from '@file-viewer/vite-plugin';

function removeDuplicateVendorAssets(): Plugin {
    return {
        name: 'remove-duplicate-vendor-assets',
        enforce: 'post',
        generateBundle(_options, bundle) {
            // Updated regex to catch:
            // 1. .wasm and .otf files
            // 2. Any file containing "worker" (like pdf.worker, pptx.worker) with .js or .mjs
            // 3. frame-cache .mjs files
            const duplicatePattern = /\.(wasm|otf)$|(worker.*|frame-cache)-[a-zA-Z0-9_-]+\.(js|mjs)$/i;

            for (const fileName of Object.keys(bundle)) {
                if (fileName.startsWith('static/') && duplicatePattern.test(fileName)) {
                    delete bundle[fileName];
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        fileViewerRenderers({
            copyAssets: true, 
        }),
        removeDuplicateVendorAssets(),
    ],
    build: {
        outDir: 'build',
        assetsDir: 'static',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    esbuild: {
        drop: ['console', 'debugger'],
    },
});