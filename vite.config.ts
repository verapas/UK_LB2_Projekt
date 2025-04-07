import { defineConfig } from 'vite'
import { VitePluginNode } from 'vite-plugin-node'

export default defineConfig({
  root: '.',
  optimizeDeps: {
    exclude: ['fsevents'],
  },
  server: {
    port: 4200,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
    },
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './server/index.ts',
      exportName: 'viteNodeApp',
      tsCompiler: 'esbuild',
    }),
  ],
})
