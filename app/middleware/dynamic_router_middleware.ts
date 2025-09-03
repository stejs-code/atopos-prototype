import parseFunction from 'parse-function'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { strUtils } from '#services/util/string_util_service'
import { camelCase } from 'lodash-es'
import app from '@adonisjs/core/services/app'
import { ResultAsync } from 'neverthrow'
import logger from '@adonisjs/core/services/logger'

export default class DynamicRouterMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const output = await next()

    const ctxAfter = await ctx.containerResolver.make(HttpContext)

    if (ctxAfter.route?.handler) return // has been handled by some handler

    // const url = ctxAfter.request.url()
    // console.log(output)

    const route = await this.findRoute(ctx.request)

    const moduleIdentifier = `#controllers/${strUtils.fileName(route.presenter + ' presenter')}`
    const presenterModule = await ResultAsync.fromPromise(app.import(moduleIdentifier), (e) => e)

    if (presenterModule.isErr()) {
      logger.warn(`Couldn't find module ${moduleIdentifier}`)
      return
    }

    const presenter = (presenterModule.value as any)?.default

    if (!presenter) {
      throw new Error(`Module ${moduleIdentifier} doesn't have any default exports`)
    }

    const instance = await ctxAfter.containerResolver.make(presenter)
    this.parseActionParameters(instance.actionDetail)
    const meta = Reflect.getMetadata("design:paramtypes", presenter.prototype, "actionDetail")
    // const meta = Reflect.getMetadataKeys( presenter.prototype)
    console.log({ meta })

    // app.container.make()
    console.log(route, presenterModule)

    return output
  }

  async findRoute(req: HttpContext['request']) {
    // 1. async // TODO
    // 2. translations // TODO
    // 3. basic

    return this.deriveBasicRoute(req)
  }

  deriveBasicRoute(req: HttpContext['request']): DynamicRoute {
    let path = req.url()
    if (path.startsWith('/')) {
      path = path.substring(1)
    }

    const [unparsedPresenterName, unparsedAction] = path.split('/')

    const presenterName = strUtils.className(unparsedPresenterName)
    const presenterFileName = strUtils.fileName(presenterName)
    // console.log({presenterFileName})

    const action = camelCase(unparsedAction)
    return {
      presenter: presenterName,
      action: action,
      params: {},
    }
  }

  parseActionParameters(method: any) {
const params = strUtils.getParamNames(method)
    console.log(params)
  }
}

type DynamicRoute = {
  presenter: string // e.g. "User"
  action: string // e.g. "detail"
  params: Record<string, number | string | true>
}
