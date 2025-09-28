import { defineConfig, namedRoute } from '../atopos/server/config.js'
import UserPresenter from '#controllers/user_presenter'

export const atopos = defineConfig({
  // atoposManifestPath: './app/presenter-manifest.ts',
  // manifestModule: () => import('../app/presenter-manifest.js'),

  presentersDir: './app/controllers',

  serverLoadedViteDir: ['src/views', 'src/layouts'],

  router: {
    '/user/:id/detail': namedRoute(UserPresenter, "actionDetail"),
    // '/': namedRoute(UserPresenter, "actionDetail"),
    '/user/:id/edit': namedRoute(UserPresenter, "actionEdit"),
  },
})
