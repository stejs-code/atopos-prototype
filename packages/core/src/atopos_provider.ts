import type { ApplicationService } from '@adonisjs/core/types'
import debug from './debug.js'
import { inject } from '@adonisjs/core'
import { AtoposConfig } from './config/index.js'

@inject()
export default class AtoposProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {
    debug('boot provider')
    const config = this.app.config.get<AtoposConfig>('atopos.atopos')

    if (this.app.inDev) {
      const { PresenterManifestBuilder } = await import('./manifest/builder.js')
      debug('builder imported')
      PresenterManifestBuilder.config = config

      await PresenterManifestBuilder.startDev()

      // await PresenterManifestBuilder.loadAllEntries()
      //
      // await PresenterManifestBuilder.pipeToManifest()
      //
      // PresenterManifestBuilder.startWatching()
    }

    const router = await this.app.container.make('router')

    if (config.router) {
      const cls = await config.router().then((i) => i.default)

      const dynamicRouter = await this.app.container.make(cls)

      await dynamicRouter.registerRoutes()

      dynamicRouter.assignToRouter(router)
    }
  }

  /**
   * The application has been booted
   */
  async start() {
    // const config = this.app.config.get<AtoposConfig>('atopos.atopos')
    //
    // for (const [key, value] of Object.entries(config.router)) {
    //   router
    //     .any(key, async (ctx) => {
    //       const route = new DynamicRoute(value.presenterId, value.action, {
    //         ...ctx.params,
    //         ...value.params,
    //       })
    //
    //       await route.execute(ctx)
    //     })
    //     .as(`${value.presenterId}:${lowerFirst(value.action)}`)
    // }
  }

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shut down the app
   */
  async shutdown() {}
}
