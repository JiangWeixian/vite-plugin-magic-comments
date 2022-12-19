import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pages from 'vite-plugin-pages'
import { VitePluginDocument } from 'vite-plugin-document'
import { magicComments } from 'vite-plugin-magic-comments'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pages(), VitePluginDocument(), magicComments()],
  build: {
    manifest: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
