import type { ApplicationService } from '@adonisjs/core/types'
import { AtoposConfig } from '../server/config.js'
import router from '@adonisjs/core/services/router'
import { DynamicRoute } from '#middleware/dynamic_router_middleware'

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
    if (this.app.inDev) {
      const { PresenterManifestBuilder } = await import('../shared/manifest/manifest-builder.js')
      await PresenterManifestBuilder.loadAllEntries()

      await PresenterManifestBuilder.pipeToManifest()

      PresenterManifestBuilder.startWatching()
    }
  }

  /**
   * The application has been booted
   */
  async start() {
    const config = this.app.config.get<AtoposConfig>('atopos.atopos')

    for (const [key, value] of Object.entries(config.router)) {
      router.any(key, async (ctx) => {
        const route = new DynamicRoute(value.presenterId, value.action, ctx.params)

        await route.execute(ctx)
      })
    }
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
