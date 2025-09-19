import { inject } from '@adonisjs/core'
import { QwikEngineService } from '#services/qwik/qwik_engine_service'
import { StreamWriter } from '@qwik.dev/core/internal'
import {
  InferLoaderParameters,
  QwikLoader,
} from '../../../loaders-plugin/qwik_loader'
import QwikLocationLoader from './loaders/qwik_location_loader.js'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export class QwikTemplate {
  public templateFile?: string
  protected loaders: QwikLoader[] = []
  public loaderStrategy: 'eager' | 'lazy' = 'eager'

  constructor(
    protected httpContext: HttpContext,
    protected qwik: QwikEngineService
  ) {}

  setFile(tpl: string) {
    this.templateFile = tpl
    return this
  }

  async addLoader<TLoader extends QwikLoader>(
    loader: new (...a: any) => TLoader,
    ...args: InferLoaderParameters<TLoader>
  ) {
    const instance: QwikLoader = await this.httpContext.containerResolver.make(loader)

    instance.parameters = args
    if (this.loaderStrategy === 'eager') instance.startLoading()

    this.loaders.push(instance)
  }

  async renderToStream(stream: StreamWriter) {
    await this.addLoader(QwikLocationLoader, '', 'xd')

    const qData = await this.getQData()

    return await this.qwik.renderToStream(
      {
        qData: qData,
      },
      stream
    )
  }

  async getQData() {
    const promises = this.loaders.map((loader) =>
      loader.data.then((data) => {
        return [loader.constructor.name, data]
      })
    )

    const loaders = await Promise.all(promises)

    return {
      loaders: Object.fromEntries(loaders)
    }
  }
}

export type QData = {
  loaders: [string, any][]
}
