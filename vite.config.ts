import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'singlefile' ? [viteSingleFile()] : []),
  ],
  build: {
    cssCodeSplit: mode !== 'singlefile',
    assetsInlineLimit: mode === 'singlefile' ? 100000000 : 4096,
  },
}))
