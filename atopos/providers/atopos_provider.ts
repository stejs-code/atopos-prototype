import type { ApplicationService } from '@adonisjs/core/types'

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
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shut down the app
   */
  async shutdown() {}
}
