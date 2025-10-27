/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'

router.get("/test", () => "ahoj")
router.get('/dump-viewer', async () => {
  if (app.inProduction) throw new Error('only in dev')
  const { dumpViewer } = await import('@hot-hook/dump-viewer')

  // reply.header('Content-Type', 'text/html; charset=utf-8')
  return dumpViewer()
})
