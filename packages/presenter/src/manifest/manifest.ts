import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { AtoposConfig } from '../config/config.js'
import { JsonManifest, PresenterRecord } from './types.js'

export class Manifest {
  public readonly presenters: Map<string, PresenterRecord> = new Map()

  static async makeProductionManifest() {
    const manifest = new Manifest()
    const config = app.config.get<AtoposConfig>('atopos.atopos')

    const json: JsonManifest = await fs.promises
      .readFile(join(app.appRoot.pathname, config.build.manifestPath))
      .then((file) => JSON.parse(file.toString()))

    for (const [k, pres] of Object.entries(json.presenters)) {
      manifest.presenters.set(k, {
        metadata: pres.metadata,
        declaration: this.createImportDefaultClosure(pres.importPath),
      })
    }

    return manifest
  }

  static createImportDefaultClosure(path: string) {
    return async () => {
      // TODO: Presenter files should be marked as boundary files, here is the crucial import
      return await import(path).then((m) => m.default)
    }
  }

  public getPresenter(presenterId: string): PresenterRecord | undefined {
    return this.presenters.get(presenterId)
  }
}

app.container.singleton(Manifest, async () => {
  if (app.inProduction) {
    return await Manifest.makeProductionManifest()
  }

  return new Manifest()
})

export const manifest = await app.container.make(Manifest)
