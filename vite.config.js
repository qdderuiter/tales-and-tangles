import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` inlines all JS + CSS into one self-contained dist/index.html
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'es2020' }
});
