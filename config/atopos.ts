import { defineConfig } from '../atopos/server/config.js'

export const atopos = defineConfig({
  // atoposManifestPath: './app/presenter-manifest.ts',
  // manifestModule: () => import('../app/presenter-manifest.js'),

  presentersDir: './app/controllers',

  serverLoadedViteDir: ['src/views', 'src/layouts']
})
