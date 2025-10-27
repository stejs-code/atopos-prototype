import { Presenter } from './presenter.js'
import { manifest } from '../shared/manifest/manifest.js'
import { ActionID, PresenterID } from '../shared/utils.js'

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
    if (presenterMeta) {

    }

    return new Mosaic(presenterId, actionID)
  }
}

// type ActionNames<T extends typeof Presenter> =
//   { [K in keyof InstanceType<T> & string]:
//     K extends `action${infer Rest}` ? Uncapitalize<Rest> : never
//   }[keyof InstanceType<T> & string];
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
