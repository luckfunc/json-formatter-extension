import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'background' || chunk.name === 'content') {
            return `[name]/index.js`;
          }
          return `[name]/index.js`;
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'copy-themes',
      writeBundle() {
        const fs = require('fs');
        const path = require('path');

        const themesSource = resolve(__dirname, 'src/themes');
        const themesTarget = resolve(__dirname, 'dist/themes');

        if (fs.existsSync(themesSource)) {
          fs.mkdirSync(path.dirname(themesTarget), { recursive: true });
          fs.cpSync(themesSource, themesTarget, { recursive: true });
        }
      }
    }]
});
