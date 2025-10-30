import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export class QwikLoader {
  public parameters: any[] = []
  constructor(protected httpContext: HttpContext) {}

  resolve<TLoader extends QwikLoader>(
    _loader: new (...a: any) => TLoader
  ): Promise<InferLoaderData<TLoader>> {
    return {} as any // TODO
  }

  load(..._: any[]): MaybePromise<any> {}

  private dataPromise?: Promise<any>
  get data(): Promise<ReturnType<this['load']>> {
    if (!this.dataPromise) {
      const response = this.load(...this.parameters)
      if (response instanceof Promise) {
        this.dataPromise = response
      } else {
        this.dataPromise = Promise.resolve(response)
      }
    }

    return this.dataPromise
  }

  /**
   * Returns true if loading was invoked, false if it already started
   */
  startLoading() {
    return this.dataPromise !== this.data
  }
}

export class QwikPassthroughLoader<T> extends QwikLoader {
  load(param: T): T {
    return param
  }
}

export type InferLoaderData<Loader extends QwikLoader> = ReturnType<Loader['load']>
export type InferLoaderParameters<Loader extends QwikLoader> = Parameters<Loader['load']>

type MaybePromise<T> = T | Promise<T>
