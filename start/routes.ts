/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { QwikEngineService } from '#services/qwik/qwik_engine_service'
import { PassThrough } from 'node:stream'

router.get('/', async (ctx) => {
  const qwik = await ctx.containerResolver.make(QwikEngineService)

  const pass = new PassThrough()

  ctx.response.stream(pass)

  await qwik.renderToStream({}, pass)

  pass.end()
})
