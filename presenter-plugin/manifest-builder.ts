import app from '@adonisjs/core/services/app'
import fs from 'fs'
import { classNameString } from './utils.js'
import path from 'node:path'
import { Project } from 'ts-morph'

export class PresenterManifestBuilder {
  static presenterDir = app.httpControllersPath()
  static presenterImportPrefix = '#controllers/'
  static manifestPath = './app/presenter-manifest.ts'

  static project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  static presenters: PresenterFile[] = []
  private static watchIterator?: NodeJS.AsyncIterator<fs.promises.FileChangeInfo<string>>

  static async loadAllEntries(): Promise<void> {
    this.presenters = []
    const paths = await fs.promises.readdir(this.presenterDir, { recursive: true })
    for (const filePath of paths) {
      const presenter = new PresenterFile(path.join(this.presenterDir, filePath))

      if (!presenter.className.endsWith('Presenter')) {
        continue
      }

      presenter.loadMetaData()

      this.presenters.push(presenter)
    }

    await Promise.all(this.presenters.map((i) => i.metadataPromise))
  }


  static async emit(): Promise<void> {
    const body = await this.renderToString();

    try {
      // Read existing contents (if file exists)
      const existing = await fs.promises.readFile(this.manifestPath, "utf-8");

      // Only write if contents differ
      if (existing === body) {
        return; // No change, skip writing
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        // Rethrow if it's not a "file not found" error
        throw err;
      }
      // If file doesn't exist, we'll just write it
    }

    await fs.promises.writeFile(this.manifestPath, body);
  }

  static async renderToString(): Promise<string> {
    let body = ''

    body += 'const presenterRegistry = {\n'
    const tab = '  '
    for (const presenter of this.presenters) {
      if (this.presenters[0] !== presenter) body += ',\n\n'
      if (!presenter.metadata) await presenter.loadMetaData()
      body += `${tab}${presenter.pureClassName}: { declaration: () => import("${this.presenterImportPrefix}${presenter.relativeFilePath.replace('.ts', '')}").then(m => m.default), metadata: ${JSON.stringify(presenter.metadata)}}`
    }

    body += '\n} as const;\n\nexport default presenterRegistry\n'
    return body
  }

  static getPresenter(className: string) {
    return this.presenters.find((presenter) => {
      return presenter.className === className
    })
  }

  static startWatching(): void {
    if (this.watchIterator) return

    new Promise(async () => {
      if (!this.watchIterator) {
        this.watchIterator = fs.promises.watch(this.presenterDir, { recursive: true })
      }

      for await (const event of this.watchIterator) {
        if (event.eventType === 'change') {
          const presenter = this.presenters.find(
            (presenter) => presenter.relativeFilePath === event.filename
          )

          if (!presenter && event.filename) {
            const presenter = new PresenterFile(path.join(this.presenterDir, event.filename))

            this.presenters.push(presenter)
          } else if (presenter) {
            presenter.metadata = undefined
            presenter.metadataPromise = undefined
          }
        }

        await this.emit()
      }
    }).finally(() => this.startWatching())
  }
}

class PresenterFile {
  public className: string
  public pureClassName: string
  public fileName: string
  public metadata?: PresenterMetadata
  public metadataPromise?: Promise<PresenterMetadata>
  public relativeFilePath: string

  constructor(public filePath: string) {
    const file = path.parse(this.filePath)
    this.className = classNameString(file.name) // From File
    this.pureClassName = this.className.slice(0, this.className.length - 'Presenter'.length)
    this.fileName = file.name // From File
    this.relativeFilePath = this.filePath.slice(PresenterManifestBuilder.presenterDir.length + 1) // user_presenter.ts
  }

  async loadMetaData() {
    this.metadataPromise = this.startLoadingMetadata().then(() => this.metadata!)
  }

  private async startLoadingMetadata() {
    const source = PresenterManifestBuilder.project.addSourceFileAtPath(this.filePath)
    const cls = source.getClasses().find((cls) => cls.isDefaultExport())
    if (!cls) throw new Error(`No presenter class found in file ${this.filePath}`)
    const presMetadata: PresenterMetadata = {
      fileName: this.fileName,
      className: cls.getName()!,
      methods: [],
    }

    const methods = cls.getMethods()
    const supportedParameterTypes = ['String', 'Boolean', 'Number'] as const

    for (const method of methods) {
      const methodMetadata: MethodMetadata = {
        name: method.getName(),
        parameters: [],
        purpose: method.getName().startsWith('action') ? 'action' : 'unknown',
      }

      methodMetadata.parameters = method.getParameters().map((a) => {
        const param: ParameterMetadata = {
          name: a.getName(),
          type: a.getType().getApparentType().getText(),
          optional: a.isOptional(),
          purpose: 'parameter',
        }

        if (methodMetadata.purpose === 'action') {
          if (param.name === 'data') {
            param.purpose = 'bodyData'
          } else if (supportedParameterTypes.includes(param.type as any)) {
            param.purpose = 'parameter'
          } else {
            throw new Error(
              `Invalid parameter type "${param.type}", note that injecting cannot be done via parameters in presenter actions`
            )
          }
        }

        return param
      })

      presMetadata.methods.push(methodMetadata)
    }

    PresenterManifestBuilder.project.removeSourceFile(source)
    this.metadata = presMetadata
  }
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
