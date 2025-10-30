/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { test, yu } from '@atopos/core'

import router from '@adonisjs/core/services/router'

router.get('/', async () => 'It works!' + test + yu.x)
