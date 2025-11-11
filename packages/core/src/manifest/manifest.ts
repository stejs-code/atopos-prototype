import app from '@adonisjs/core/services/app'
import { AtoposConfig } from '../config/index.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { JsonManifest, JsonPresenterRecord, PresenterRecord } from './types.js'
import { omit, pick } from 'lodash-es'
import debug from '../debug.js'

export class Manifest {
  public readonly presenters: Map<string, PresenterRecord> = new Map()

  static getFilePath(): string {
    const config = app.config.get<AtoposConfig>('atopos.atopos')

    return path.join(app.appRoot.pathname, config.build.manifestPath)
  }

  static async makeProductionManifest() {
    const manifest = new Manifest()

    const json = await this.readBuiltManifest()

    for (const [k, pres] of Object.entries(json.presenters)) {
      manifest.presenters.set(k, {
        ...pick(pres, ['metadata', 'importPath', 'buildHash']),
        declaration: this.createImportDefaultClosure(pres.importPath),
      })
    }

    return manifest
  }

  static async readBuiltManifest(): Promise<JsonManifest> {
    try {
      return await fs.promises
        .readFile(this.getFilePath())
        .then((file) => JSON.parse(file.toString()))
    } catch (error) {
      return {
        presenters: {},
      }
    }
  }

  async writeToFile() {
    debug('start manifest.writeToFile')
    const json = this.toJSON()

    const filePath = Manifest.getFilePath()
    // Ensure parent directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

    await fs.promises.writeFile(filePath, JSON.stringify(json, null, 2), {
      encoding: 'utf8',
    })
    debug('end manifest.writeToFile')
  }

  toJSON(): JsonManifest {
    return {
      presenters: Object.fromEntries(
        this.presenters
          .entries()
          .map(([k, v]) => [k, omit(v, 'declaration')] satisfies [string, JsonPresenterRecord])
          .toArray()
          .sort(([a], [b]) => a.localeCompare(b))
      ),
    }
  }

  static createImportDefaultClosure(importPath: string) {
    return async () => {
      // TODO: Presenter files should be marked as boundary files, here is the crucial import
      return await app.import(importPath).then((m: any) => m.default)
    }
  }
}

app.container.singleton(Manifest, async () => {
  if (app.inProduction) {
    return await Manifest.makeProductionManifest()
  }

  return new Manifest()
})

export const manifest = await app.container.make(Manifest)
