import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { strUtils } from '#services/util/string_util_service'
import { camelCase, upperFirst } from 'lodash-es'
import { z } from 'zod/v4'
import { Presenter } from '../../atopos/server/presenter.js'
import { PassThrough } from 'node:stream'
import { manifest, MethodMetadata } from '../../atopos/shared/manifest/manifest.js'
import router from '@adonisjs/core/services/router'

export default class DynamicRouterMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (router.match(ctx.request.url(false), ctx.request.method())) {
      return await next()
    }

    const route = await this.findRoute(ctx.request)

    if (await route.isExecutable(ctx)) {
      await route.execute(ctx)
    } else {
      await next()
    }
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

    const action = camelCase(unparsedAction)
    return new DynamicRoute(presenterName, action, {})
  }

  parseActionParameters(method: any) {
    const params = strUtils.getParamNames(method)
    console.log(params)
  }
}

export class DynamicRoute {
  constructor(
    public presenterId: string, // e.g. "User"
    public action: string, // e.g. "detail"
    public params: Record<string, number | string | true>
  ) {
    this.presenterId = Presenter.parsePresenterId(presenterId)
    this.action = Presenter.parseActionId(action)
  }

  async execute(httpContext: HttpContext): Promise<void> {
    const { response } = httpContext

    if (!this.presenterExists()) {
      httpContext.response.send(`Presenter ${this.presenterId} not found`)
      return
    }

    const instance: Presenter = await this.getInstance(httpContext)

    const acName = this.getActionMethodName()
    const action = await this.getAction(httpContext)

    if (!action) {
      throw new Error(`No method named ${acName}`)
    }

    const methodMeta = this.getMetadata()?.methods.find((method) => method.name === acName)

    if (!methodMeta) {
      throw new Error(`No metadata found for method ${this.presenterId}.${acName}`)
    }

    if (methodMeta.purpose !== 'action') {
      throw new Error(`Metadata found for method named ${acName} don't have "action" purpose`)
    }

    const args = this.deriveArgumentsFromRequest(httpContext.request, methodMeta)

    const actionResponse = await action(...args)

    const tpl = instance.getTemplate()
    // TODO add, maybe, something
    if (typeof actionResponse === 'string') {
      response.header('Content-Type', 'text/html; charset=utf-8')
      response.send(actionResponse)
    } else if (actionResponse instanceof Response) {
      response.send(actionResponse)
    } else if (tpl) {
      const isQData = 'q-data' in httpContext.request.qs()

      if (!isQData) {
        response.header('Content-Type', 'text/html; charset=utf-8')
        response.header('Transfer-Encoding', 'chunked')
        const pass = new PassThrough()

        response.stream(pass)

        await tpl.renderToStream(pass)

        pass.end()
      } else {
        const templateInfo = await tpl.getTemplate()
        response.header(
          'X-Prefetch-Modules',
          JSON.stringify([templateInfo.view.modulePath, templateInfo.layout.modulePath])
        )
        response.header('Content-Type', 'application/json; charset=utf-8')
        response.header('Cache-Control', 'no-cache')
        response.header('X-Accel-Buffering', 'no') // helps with Nginx
        response.header('Transfer-Encoding', 'chunked')

        // Send headers now
        response.relayHeaders()
        response.response.flushHeaders()

        const qData = await tpl.getQData()
        response.response.write(JSON.stringify(qData))

        response.response.end()
      }
    }
  }

  deriveArgumentsFromRequest(req: HttpContext['request'], methodMeta: MethodMetadata) {
    return methodMeta.parameters.map((param) => {
      let value = undefined

      // from body
      // from this.params
      // from query
      const query = req.qs()
      if (param.purpose === 'bodyData' && req.hasBody()) {
        value = req.body()
      } else if (param.name in this.params) {
        value = this.params[param.name]
      } else if (param.name in query) {
        value = query[param.name]
      }

      if (param.type === 'Boolean') {
        value = z.coerce.boolean().parse(value)
      } else if (param.type === 'Number') {
        value = z.coerce.number().parse(value)
        if (Number.isNaN(value)) throw new Error(`NaN provided to ${param.name}`)
      } else if (param.type === 'String') {
        //
      } else if (param.purpose === 'bodyData') {
        //
      } else {
        return JSON.parse(value)
      }

      if (!param.optional && (value === undefined || value === null)) {
        throw new Error(`Parameter ${param.name} is required`)
      }

      return value
    })
  }

  getActionMethodName(): string {
    return 'action' + upperFirst(this.action)
  }

  getPresenterName() {
    return this.presenterId + 'Presenter'
  }

  presenterExists() {
    return manifest.presenters.has(this.presenterId)
  }

  getPresenterRecord() {
    return manifest.getPresenter(this.presenterId)
  }

  async getPresenterClass(): Promise<any> {
    return await this.getPresenterRecord()?.declaration()
  }

  private instance: Presenter | undefined
  async getInstance(httpContext: HttpContext): Promise<any> {
    const cls = await this.getPresenterClass()
    if (!cls) return undefined
    if (this.instance?.constructor === cls) return this.instance

    this.instance = await httpContext.containerResolver.make(cls)

    return this.instance
  }

  async getAction( httpContext: HttpContext ): Promise<Function | any> {
    const instance = (await this.getInstance(httpContext))
      return instance[this.getActionMethodName()]?.bind(instance)
  }


  getMetadata() {
    return this.getPresenterRecord()?.metadata
  }

  async isExecutable(httpContext: HttpContext) {
    return (
      this.presenterExists() &&
      typeof await this.getAction(httpContext) === 'function'
    )
  }
}
