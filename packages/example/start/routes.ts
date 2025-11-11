/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { manifest } from '@atopos/core'

router.get('/', async (ctx) => {
  // console.log(await new PresenterID('User').getInstance(ctx))
  // console.log(manifest.presenters)
  ctx.response.send(JSON.stringify(Object.fromEntries(manifest.presenters.entries())))
})
