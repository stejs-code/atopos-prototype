import { HttpRouterService } from '@adonisjs/core/types'
import { Mosaic, MosaicInput } from './mosaic.js'
import RouteRecognizer, { Result } from 'route-recognizer'
import { HttpContext } from '@adonisjs/core/http'
import { ActionID, PresenterID } from '../utils/index.js'
import { OpaqueParams, RouteHandler } from './types.js'

export class Route {
  protected isCanonical = false
  protected path: string // "aaa/b" | "cs/c/a" | "xa/<id:number>" | "cs/<$presenter>"
  protected result: {
    presenter?: string
    action?: string
    params: Record<string, any>
  } = {
    presenter: undefined,
    action: undefined,
    params: {},
  }

  constructor(path: string) {
    this.path = path
  }

  public setPath(path: string) {
    this.path = path
    return this
  }

  public mosaic(mosaic: MosaicInput<any, any>) {
    const m = mosaic instanceof Mosaic ? mosaic : Mosaic.make(mosaic)

    this.result.presenter = m.presenterID.getID()
    this.result.action = m.actionID.getID()
    this.addParams(m.parameters)

    return this
  }

  public addParams(params: Record<string, any>) {
    this.result.params = {
      ...this.result.params,
      ...params,
    }

    return this
  }

  public addParam(key: string, value: any) {
    this.result.params[key] = value
    return this
  }

  public canonical(value: boolean = true) {
    this.isCanonical = value
    return this
  }

  public parsePath(): PathSegment[] {
    let path = this.path
    if (path.startsWith('/')) path = path.substring(1)

    return path.split('/').map((i): PathSegment => {
      console.log('seg', i)
      if (i.startsWith('<') && i.endsWith('>')) {
        let [name, validation = 'string'] = i.substring(1, i.length - 1).split(':')

        if (!['string', 'number'].includes(validation)) {
          validation = 'string'
        }

        console.log('val', validation)
        return {
          type: 'param',
          validation: validation as any,
          name: name,
        }
      }

      return {
        type: 'literal',
        value: i,
      }
    })
  }

  static createParamValidator(parsed: PathSegment[]) {
    const validationObject = Object.fromEntries(
      parsed //
        .filter((i) => i.type === 'param')
        .map((i) => [i.name, i.validation])
    )

    return function (params: Record<string, any>): Record<string, any> {
      const result: Record<string, any> = {}

      result.action$ = params.action$
      result.presenter$ = params.presenter$

      for (const paramName in validationObject) {
        const value = params[paramName]

        if (validationObject[paramName] === 'string') {
          if (typeof value === 'string') {
            result[paramName] = value
          } else {
            const parsedValue = value?.toString()

            if (!parsed) {
              throw Error(`Invalid param: ${paramName}`)
            }

            result[paramName] = parsedValue
          }
        }

        if (validationObject[paramName] === 'number') {
          if (typeof value === 'number') {
            result[paramName] = value
          } else {
            const parsedValue = Number(value)

            if (Number.isNaN(parsed)) {
              throw Error(`Invalid param: ${paramName}`)
            }

            result[paramName] = parsedValue
          }
        }
      }

      return result
    }
  }

  public resolveMosaic(parsedParams: OpaqueParams) {
    const { presenter$, action$, ...params } = {
      ...parsedParams,
      ...this.result.params,
    }

    const presenterID = new PresenterID(presenter$ ?? this.result.presenter)
    const actionID = new ActionID(action$ ?? this.result.action, presenterID)

    return new Mosaic(presenterID, actionID, params)
  }
}

type PathSegment =
  | { type: 'literal'; value: string }
  | { type: 'param'; validation: 'string' | 'number'; name: string }

export abstract class DynamicRouter {
  private routes: Set<Route> = new Set()

  private _router: RouteRecognizer.default | undefined
  public get router(): RouteRecognizer.default {
    if (this._router) return this._router

    return this.rebuildRouter()
  }

  public rebuildRouter() {
    // @ts-ignore
    this._router = new RouteRecognizer()

    for (const route of this.routes) {
      const parsed = route.parsePath()
      const paramValidator = Route.createParamValidator(parsed)
      const path =
        '/' +
        parsed
          .map((i) => {
            if (i.type === 'literal') return i.value
            return `:${i.name}`
          })
          .join('/')

      console.log(path)

      this._router?.add([
        {
          path: path,
          handler: {
            route,
            paramValidator,
          } satisfies RouteHandler,
        },
      ])
    }

    return this._router as RouteRecognizer.default
  }

  abstract registerRoutes(): void

  async handle(ctx: HttpContext) {
    const url = ctx.params['*']?.join('/') ?? ''

    const results = this.router.recognize(url)

    const route = results?.[0] as Result & { handler: RouteHandler }

    if (!route) {
      ctx.response.notFound('Route Not Found')
      return
    }

    const parsedParams = route.handler.paramValidator(route.params)

    const mosaic = route.handler.route.resolveMosaic(parsedParams)

    await mosaic.execute(ctx)
  }

  assignToRouter(router: HttpRouterService) {
    router.any('*', async (ctx) => {
      await this.handle(ctx)
    })

    this.rebuildRouter()
  }

  protected makeRoute(
    path: string,
    mosaic?: MosaicInput<any, any>,
    parameters?: Record<string, any>
  ) {
    const route = new Route(path)

    this.routes.add(route)

    if (mosaic) {
      route.mosaic(mosaic)
    }

    if (parameters) {
      route.addParams(parameters)
    }

    return route
  }
}
