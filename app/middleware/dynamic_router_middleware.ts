import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { strUtils } from '#services/util/string_util_service'
import { camelCase, upperFirst } from 'lodash-es'
import presenterRegistry from '../presenter-manifest.js'
import { z } from 'zod/v4'
import { MethodMetadata } from '../../presenter-plugin/manifest-builder'
import { Presenter } from '../../presenter-plugin/presenter'
import { PassThrough } from 'node:stream'

export default class DynamicRouterMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // await next()

    const ctxAfter = await ctx.containerResolver.make(HttpContext)

    if (ctxAfter.route?.handler) return // has been handled by some handler
    const route = await this.findRoute(ctx.request)

    await route.execute(ctx)
    // const url = ctxAfter.request.url()
    // console.log(output)

    // const instance = await ctxAfter.containerResolver.make(presenter)
    // this.parseActionParameters(instance.actionDetail)
    // const meta = Reflect.getMetadata('design:paramtypes', presenter.prototype, 'actionDetail')
    // // const meta = Reflect.getMetadataKeys( presenter.prototype)
    // console.log({ meta })
    //
    // // app.container.make()
    // console.log(route, presenterModule)
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

type ManifestKeys = keyof typeof presenterRegistry
type ManifestVals = (typeof presenterRegistry)[ManifestKeys]

export class DynamicRoute {
  constructor(
    public presenter: string, // e.g. "User"
    public action: string, // e.g. "detail"
    public params: Record<string, number | string | true>
  ) {}

  async execute(httpContext: HttpContext): Promise<void> {
    if (!this.presenterExists()) {
      // `Presenter ${this.presenter} not found`
      return
    }
    const decl = await this.getPresenterClass()
    const instance: Presenter = await httpContext.containerResolver.make(decl)

    const acName = this.getActionMethodName()
    const action = instance[acName as keyof typeof instance] as Function

    if (!action) {
      throw new Error(`No method named ${acName}`)
    }

    const methodMeta = this.getMetadata().methods.find((method) => method.name === acName)

    if (!methodMeta) {
      throw new Error(`No metadata found for method named ${acName}`)
    }

    if (methodMeta.purpose !== 'action') {
      throw new Error(`Metadata found for method named ${acName} don't have "action" purpose`)
    }

    const args = this.deriveArgumentsFromRequest(httpContext.request, methodMeta)

    const response = await action.bind(instance, ...args)()

    const tpl = instance.getTemplate()
    // TODO add, maybe, something
    if (typeof response === 'string') {
      httpContext.response.header('Content-Type', 'text/plain')
      httpContext.response.send(response)
    } else if (response instanceof Response) {
      httpContext.response.send(response)
    } else if (tpl) {
      const isQData = 'q-data' in httpContext.request.qs()

      if (!isQData) {
        const pass = new PassThrough()

        httpContext.response.stream(pass)

        await tpl.renderToStream(pass)

        pass.end()
      } else {
        httpContext.response.send(await tpl.getQData())
      }
    }
  }

  deriveArgumentsFromRequest(req: HttpContext['request'], methodMeta: ManifestMethodMetadata) {
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
    return this.presenter + 'Presenter'
  }

  presenterExists() {
    return (this.presenter as ManifestKeys) in presenterRegistry
  }

  getPresenterRecord() {
    return presenterRegistry[this.presenter as ManifestKeys] as ManifestVals
  }

  getPresenterClass() {
    return this.getPresenterRecord().declaration()
  }

  getMetadata() {
    return this.getPresenterRecord().metadata
  }
}

// Utility: make all properties required recursively
type Primitive = string | number | boolean | bigint | symbol | null | undefined

type DeepRequired<T> = T extends Primitive | Function | Date | RegExp
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepRequired<U>>
    : T extends Array<infer U>
      ? Array<DeepRequired<U>>
      : { [K in keyof T]-?: DeepRequired<T[K]> }

// Manifest method metadata with all nested properties required
type ManifestMethodMetadata = DeepRequired<MethodMetadata>
