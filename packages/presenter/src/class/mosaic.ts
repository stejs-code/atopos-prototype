import { Presenter } from './presenter.js'
import { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod/v4'
import { ActionID, PresenterID } from '../utils/index.js'
import { MethodMetadata } from '../manifest/index.js'

export class Mosaic {
  protected presenterID: PresenterID
  protected actionID: ActionID
  protected parameters: Record<string, any>

  constructor(
    presenterID: string | PresenterID,
    actionID: string | ActionID,
    parameters: Record<string, any> = {}
  ) {
    this.presenterID = new PresenterID(presenterID)
    this.actionID = new ActionID(actionID, this.presenterID)
    this.parameters = parameters
  }

  static make<T extends typeof Presenter, M extends ActionMethods<T>>(mosaic: MosaicInput<T, M>) {
    if (typeof mosaic === 'string') return Mosaic.makeFromString(mosaic)

    return Mosaic.makeFromGetter(mosaic)
  }

  static makeFromString(string: string) {
    const [main, ...strParameters] = string.split(' ')

    const [presenter, method] = main.split(':')

    const parameters = Object.fromEntries(
      strParameters.map((str) => {
        const [name, ...values] = str.split(':')
        const value = values.join(':')

        return [name, value]
      })
    )

    return new Mosaic(presenter, method, parameters)
  }

  static makeFromGetter(mosaic: [typeof Presenter | string, (i: any) => any, ...args: any[]]) {
    let presenterId = mosaic[0]
    if (typeof presenterId !== 'string') {
      presenterId = presenterId.name
    }

    const presenterID = new PresenterID(presenterId)

    const proxy = new Proxy(
      {},
      {
        get(_, key: string) {
          return key
        },
      }
    )

    const actionID = new ActionID(mosaic[1](proxy), presenterID)
    const actionMeta = actionID.getMetadata()

    const args = mosaic[3] as any[]
    let parameters: Record<string, any> = {}

    if (actionMeta) {
      const parameterEntries = actionMeta.parameters.map((item, index) => {
        return [item.name, args[index]] // TODO: validate incoming args
      })

      parameters = Object.fromEntries(parameterEntries)
    }

    return new Mosaic(presenterId, actionID, parameters)
  }

  toHref() {}

  toJSON() {
    return {
      presenterID: this.presenterID.getID(),
      actionID: this.actionID.getID(),
      parameters: this.parameters,
    }
  }

  async execute(httpContext: HttpContext): Promise<void> {
    const { response } = httpContext

    if (!this.presenterID.exists()) {
      httpContext.response.send(`Presenter ${this.presenterID} not found`)
      return
    }

    // const instance: Presenter = await this.presenterID.getInstance(httpContext)

    const action = await this.actionID.getFunction(httpContext)

    if (!action) {
      throw new Error(`No method named ${this.actionID}`)
    }

    const methodMeta = this.actionID.getMetadata()

    if (!methodMeta) {
      throw new Error(`No metadata found for method ${this.presenterID}:${this.actionID}`)
    }

    if (methodMeta.purpose !== 'action') {
      throw new Error(
        `Metadata found for method named ${this.actionID} don't have "action" purpose`
      )
    }

    const args = this.deriveArgumentsFromRequest(httpContext.request, methodMeta)

    const actionResponse = await action(...args)

    // TODO add, maybe, something
    if (typeof actionResponse === 'string') {
      response.header('Content-Type', 'text/html; charset=utf-8')
      response.send(actionResponse)
    } else if (actionResponse instanceof Response) {
      response.send(actionResponse)
    }
    // const tpl = instance.getTemplate()
    // else if (tpl) {
    //   const isQData = 'q-data' in httpContext.request.qs()
    //
    //   if (!isQData) {
    //     response.header('Content-Type', 'text/html; charset=utf-8')
    //     response.header('Transfer-Encoding', 'chunked')
    //     const pass = new PassThrough()
    //
    //     response.stream(pass)
    //
    //     await tpl.renderToStream(pass)
    //
    //     pass.end()
    //   } else {
    //     const templateInfo = await tpl.getTemplate()
    //     response.header(
    //       'X-Prefetch-Modules',
    //       JSON.stringify([templateInfo.view.modulePath, templateInfo.layout.modulePath])
    //     )
    //     response.header('Content-Type', 'application/json; charset=utf-8')
    //     response.header('Cache-Control', 'no-cache')
    //     response.header('X-Accel-Buffering', 'no') // helps with Nginx
    //     response.header('Transfer-Encoding', 'chunked')
    //
    //     // Send headers now
    //     response.relayHeaders()
    //     response.response.flushHeaders()
    //
    //     const qData = await tpl.getQData()
    //     response.response.write(JSON.stringify(qData))
    //
    //     response.response.end()
    //   }
    // }
  }

  deriveArgumentsFromRequest(req: HttpContext['request'], methodMeta: MethodMetadata) {
    return methodMeta.parameters.map((param) => {
      let value

      // from body
      // from this.params
      // from query
      const query = req.qs()
      if (param.purpose === 'bodyData' && req.hasBody()) {
        value = req.body()
      } else if (param.name in this.parameters) {
        value = this.parameters[param.name]
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

  isExecutable() {
    return this.actionID.exists()
  }
}

type ActionMethods<T extends typeof Presenter> = InstanceType<T>[ActionKeys<T>]

type ActionKeys<T extends typeof Presenter> = {
  [K in keyof InstanceType<T> & string]: K extends `action${string}` ? K : never
}[keyof InstanceType<T> & string]

export type MosaicInput<T extends typeof Presenter, M extends ActionMethods<T>> =
  | [
      T,
      (p: InstanceType<T>) => M,
      ...params: Parameters<M extends (...args: any) => any ? M : never>,
    ]
  | string
