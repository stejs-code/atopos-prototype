import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { AtoposConfig } from '../../server/config.js'

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
      console.log(new Error().stack, import.meta.hot?.boundary)
      return await import(path, import.meta.hot?.boundary).then((m) => m.default)
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

export interface JsonManifest {
  presenters: Record<string, JsonPresenterRecord>
}

export interface PresenterRecord {
  metadata: PresenterMetadata
  declaration: () => Promise<any>
}

export interface JsonPresenterRecord {
  metadata: PresenterMetadata
  importPath: string
}

export interface PresenterMetadata {
  methods: MethodMetadata[]
  className: string
  fileName: string
}

export interface MethodMetadata {
  parameters: ParameterMetadata[]
  name: string
  purpose: 'unknown' | 'action'
}

export interface ParameterMetadata {
  name: string
  type: string
  optional: boolean
  purpose: 'parameter' | 'bodyData'
}
