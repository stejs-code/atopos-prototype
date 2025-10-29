import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import router from '@adonisjs/core/services/router'
import { Mosaic } from '../../atopos/server/mosaic.js'

export default class DynamicRouterMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (router.match(ctx.request.url(false), ctx.request.method())) {
      return await next()
    }

    const route = await this.findRoute(ctx.request)

    if (route.isExecutable()) {
      await route.execute(ctx)
    } else {
      await next()
    }
  }

  async findRoute(req: HttpContext['request']) {
    // 1. async // TODO
    // 2. translations // TODO
    // 3. basic

    return this.deriveBasicMosaic(req)
  }

  deriveBasicMosaic(req: HttpContext['request']): Mosaic {
    let path = req.url()
    if (path.startsWith('/')) {
      path = path.substring(1)
    }

    const [unparsedPresenterName, unparsedAction] = path.split('/')

    return new Mosaic(unparsedPresenterName, unparsedAction, {})
  }

  // addRoute(path: string, mosaic?: Mosaic) {}
  //
  // createRouter() {
  //   this.addRoute('/<lang>/<presenter>/<action>')
  //   this.addRoute('/ahoj/<action>', {
  //     presenter: "Welcome",
  //     lang: "cs"
  //   })
  // }
}
