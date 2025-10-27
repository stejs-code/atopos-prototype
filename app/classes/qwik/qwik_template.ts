import { inject } from '@adonisjs/core'
import { QwikEngineService } from '#services/qwik/qwik_engine_service'
import { StreamWriter } from '@builder.io/qwik'
import { InferLoaderParameters, QwikLoader } from '../../../atopos/vite/loaders-plugin/qwik_loader'
import QwikLocationLoader from './loaders/qwik_location_loader.js'
import { HttpContext } from '@adonisjs/core/http'
import DocumentHead from '#classes/qwik/document_head'

@inject()
export class QwikTemplate {
  public templateFile?: string // a-tpl -> resolves to views/a-tpl.tsx
  public layoutFile?: string // blank -> resolves to layouts/blank.tsx
  protected loaders: QwikLoader[] = []
  public loaderStrategy: 'eager' | 'lazy' = 'eager'

  constructor(
    protected httpContext: HttpContext,
    protected qwik: QwikEngineService,
    public head: DocumentHead
  ) {}

  public setFile(tpl: string) {
    this.templateFile = tpl
    return this
  }

  public setLayout(tpl: string) {
    this.layoutFile = tpl
    return this
  }

  public title: string = ''
  public titleTemplate: (title: string) => string = (title) => title

  public setTitleTemplate(func: (title: string) => string) {
    this.titleTemplate = func
    return this
  }

  public setTitle(title: string, useTemplate = true) {
    this.title = useTemplate ? this.titleTemplate(title) : title
    return this
  }

  public async addLoader<TLoader extends QwikLoader>(
    loader: new (...a: any) => TLoader,
    ...args: InferLoaderParameters<TLoader>
  ) {
    const instance: QwikLoader = await this.httpContext.containerResolver.make(loader)

    instance.parameters = args
    if (this.loaderStrategy === 'eager') instance.startLoading()

    this.loaders.push(instance)
  }

  public async renderToStream(stream: StreamWriter) {
    const qData = await this.getQData({ loadTemplateComponent: true })

    return await this.qwik.renderToStream(
      {
        qData: qData,
      },
      stream
    )
  }

  public async getQData(opts?: { loadTemplateComponent?: boolean }) {
    await this.addLoader(QwikLocationLoader)

    // await new Promise<void>((resolve) => setTimeout(resolve, 20000))

    const promises = this.loaders.map((loader) =>
      loader.data.then((data) => {
        return [loader.constructor.name, data]
      })
    )

    const loaders = await Promise.all(promises)

    return {
      loaders: Object.fromEntries(loaders),
      route: {
        head: {
          elements: this.head.getElements(),
          title: this.title,
        },
        template: await this.getTemplate(opts),
        location: this.getLocation(),
      },
    }
  }

  public async getTemplate(opts?: { loadTemplateComponent?: boolean }) {
    if (!this.templateFile || !this.layoutFile) {
      throw new Error('Layout or view is not set')
    }

    return {
      view: await this.getTemplateInfo(this.templateFile, { ...opts, directory: 'views' }),
      layout: await this.getTemplateInfo(this.layoutFile, { ...opts, directory: 'layouts' }),
    }
  }

  protected async getTemplateInfo(
    fileName: string,
    opts?: { loadTemplateComponent?: boolean; directory?: 'views' | 'layouts' }
  ) {
    const prefix = opts?.directory ? opts.directory + '/' : ''

    return {
      key: fileName,
      modulePath: `/dist/src/${prefix}${fileName}.js`,
      Component: opts?.loadTemplateComponent
        ? await this.qwik.getModule(`${prefix}${fileName}`).then((res) => res.default)
        : undefined,
    }
  }

  protected getLocation() {
    return {
      path: this.httpContext.request.parsedUrl.path,
      reqId: this.httpContext.request.id(),
    }
  }
}

export type QData = Awaited<ReturnType<QwikTemplate['getQData']>>
