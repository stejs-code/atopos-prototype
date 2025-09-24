import { inject } from '@adonisjs/core'
import { QwikEngineService } from '#services/qwik/qwik_engine_service'
import { StreamWriter } from '@qwik.dev/core/internal'
import { InferLoaderParameters, QwikLoader } from '../../../loaders-plugin/qwik_loader'
import QwikLocationLoader from './loaders/qwik_location_loader.js'
import { HttpContext } from '@adonisjs/core/http'
import { assignWith } from 'lodash-es'
import { getRawAsset } from 'node:sea'

@inject()
export class QwikTemplate {
  public templateFile?: string // a-tpl
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
    const qData = await this.getQData({ loadTemplateComponent: true })
    console.log(qData.route.template.Component({}))

    return await this.qwik.renderToStream(
      {
        qData: qData,
      },
      stream
    )
  }

  async getQData(opts?: { loadTemplateComponent?: boolean }) {
    await this.addLoader(QwikLocationLoader)

    // await new Promise<void>((resolve) => setTimeout(resolve, 200))

    const promises = this.loaders.map((loader) =>
      loader.data.then((data) => {
        return [loader.constructor.name, data]
      })
    )

    const loaders = await Promise.all(promises)

    return {
      loaders: Object.fromEntries(loaders),
      route: {
        template: await this.getTemplate(opts),
      },
    }
  }

  async getTemplate(opts?: { loadTemplateComponent?: boolean }) {
    return {
      key: this.templateFile,
      modulePath: `/dist/src/views/${this.templateFile}.js`,
      Component: opts?.loadTemplateComponent
        ? await this.qwik.getModule(`views/${this.templateFile!}`).then((res) => res.default)
        : undefined,
    }
  }
}

export type QData = Awaited<ReturnType<QwikTemplate['getQData']>>
