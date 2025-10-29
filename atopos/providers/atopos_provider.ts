import type { ApplicationService } from '@adonisjs/core/types'
import { AtoposConfig } from '../server/config.js'
import router from '@adonisjs/core/services/router'
import { lowerFirst } from 'lodash-es'
import { Mosaic } from '../server/mosaic.js'

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
      router
        .any(key, async (ctx) => {
          const route = new Mosaic(value.presenterId, value.action, {
            ...ctx.params,
            ...value.params,
          })

          await route.execute(ctx)
        })
        .as(`${value.presenterId}:${lowerFirst(value.action)}`)
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
