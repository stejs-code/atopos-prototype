import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import path, { join } from 'node:path'
import { Project } from 'ts-morph'
import { Manifest, manifest } from './manifest.js'
import { MethodMetadata, ParameterMetadata, PresenterMetadata } from './types.js'
import { AtoposConfig } from '../config/index.js'
import { classNameString, PresenterID } from '../utils/index.js'
import chokidar from 'chokidar'
import { createHash } from 'node:crypto'
import { debounce } from 'lodash-es'
import debug from '../debug.js'

export class PresenterManifestBuilder {
  static config: AtoposConfig = app.config.get<AtoposConfig>('atopos.config')
  // static presenterImportPrefix = '#controllers/'
  // static manifestPath = './app/presenter-manifest.ts'

  static project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  static presenters: PresenterFile[] = []
  private static startedWatching = false

  static async getAllPaths() {
    const loadedSources = await Promise.all(
      this.config.presentersSource.map(async (source) => {
        const paths = await fs.promises.readdir(source.dir, { recursive: true })

        return paths.map((filePath) => {
          let importPath = join(source.importPrefix, filePath)

          if (
            source.removeExtensionInImport &&
            (importPath.endsWith('.ts') || importPath.endsWith('.js'))
          ) {
            importPath = importPath.slice(0, -3)
          }

          return {
            // app.appRoot.pathname,
            path: join(source.dir, filePath),
            importPath: importPath,
          }
        })
      })
    )

    return loadedSources.flat()
  }

  static async loadAllEntries(): Promise<void> {
    this.presenters = []
    const paths = await this.getAllPaths()
    for (const { path: filePath, importPath } of paths) {
      const presenter = new PresenterFile(filePath, importPath)

      if (!presenter.className.endsWith('Presenter')) {
        continue
      }

      presenter.revalidate()

      this.presenters.push(presenter)
    }

    await Promise.all(this.presenters.map((i) => i.metadataPromise))

    this.pipeToManifest()
  }

  static pipeToManifest() {
    for (const pres of this.presenters) {
      if (!pres.metadata || !pres.buildHash) continue

      manifest.presenters.set(new PresenterID(pres.className).getID(), {
        declaration: Manifest.createImportDefaultClosure(pres.importPath),
        metadata: pres.metadata,
        importPath: pres.importPath,
        buildHash: pres.buildHash,
      })
    }
  }

  // static async emit(): Promise<void> {
  //   const json = await this.buildJson()
  //   const body = JSON.stringify(json)
  //
  //   // try {
  //   //   // Read existing contents (if file exists)
  //   //   const existing = await fs.promises.readFile(this.manifestPath, "utf-8");
  //   //
  //   //   // Only write if contents differ
  //   //   if (existing === body) {
  //   //     return; // No change, skip writing
  //   //   }
  //   // } catch (err: any) {
  //   //   if (err.code !== "ENOENT") {
  //   //     // Rethrow if it's not a "file not found" error
  //   //     throw err;
  //   //   }
  //   //   // If file doesn't exist, we'll just write it
  //   // }
  //
  //   await fs.promises.writeFile(
  //     join(this.config.build.baseDir, this.config.build.manifestPath),
  //     body
  //   )
  // }

  // static async buildJson(): Promise<JsonManifest> {
  //   const presenters: JsonManifest['presenters'] = {}
  //
  //   for (const presenter of this.presenters) {
  //     presenters[presenter.presenterId] = {
  //       metadata: presenter.metadata!,
  //       importPath: presenter.importPath,
  //     }
  //   }
  //
  //   return {
  //     presenters: presenters,
  //   }
  // }

  // static async renderToString(): Promise<string> {
  //   let body = ''
  //
  //   body += 'const presenterRegistry = {\n'
  //   const tab = '  '
  //   for (const presenter of this.presenters) {
  //     if (this.presenters[0] !== presenter) body += ',\n\n'
  //     if (!presenter.metadata) await presenter.loadMetaData()
  //     body += `${tab}${presenter.presenterId}: { declaration: () => import("${this.presenterImportPrefix}${presenter.relativeFilePath.replace('.ts', '')}").then(m => m.default), metadata: ${JSON.stringify(presenter.metadata)}}`
  //   }
  //
  //   body += '\n} as const;\n\nexport default presenterRegistry\n'
  //   return body
  // }

  static getPresenter(className: string) {
    return this.presenters.find((presenter) => {
      return presenter.className === className
    })
  }

  static startWatching(): void {
    if (this.startedWatching) return

    chokidar
      .watch(
        this.config.presentersSource.map((i) => i.dir),
        { ignoreInitial: true }
      )
      .on('all', (event, filePath) => {
        debug('watch hit', filePath, event)
        if (event === 'change') {
          const presenter = this.presenters.find((p) => p.relativeFilePath === filePath)

          if (!presenter) {
            debug('no presenter found', filePath)
          } else if (presenter) {
            presenter.revalidate()
            presenter.metadataPromise?.then(() => {
              this.pipeToManifest()

              manifest.writeToFile()
            })
          }
        } else {
          this.debouncedFullReload()?.then(() => null)
        }
      })

    this.startedWatching = true

    // new Promise(async () => {
    //   if (!this.watchIterator) {
    //     // this.watchIterator = fs.promises.watch(this.presenterDir, { recursive: true })
    //   }
    //
    //   for await (const event of this.watchIterator) {
    //     if (event.eventType === 'change') {
    //       const presenter = this.presenters.find((p) => p.relativeFilePath === event.filename)
    //
    //       if (!presenter && event.filename) {
    //         const newPresenter = new PresenterFile(path.join(this.presenterDir, event.filename))
    //
    //         this.presenters.push(newPresenter)
    //       } else if (presenter) {
    //         presenter.metadata = undefined
    //         presenter.metadataPromise = undefined
    //       }
    //     }
    //
    //     await this.pipeToManifest()
    //   }
    // }).finally(() => this.startWatching())
  }

  static async registerRecords() {
    debug('start registerRecords')
    this.presenters = []

    const paths = await this.getAllPaths()

    for (const { path: filePath, importPath } of paths) {
      const presenter = new PresenterFile(filePath, importPath)

      if (!presenter.className.endsWith('Presenter')) {
        continue
      }

      this.presenters.push(presenter)
    }

    debug('end registerRecords')
  }

  static async preloadFromManifest() {
    debug('start preloadFromManifest')
    const json = await Manifest.readBuiltManifest()

    for (const presenter of this.presenters) {
      const found = json.presenters[presenter.presenterId]

      if (!found) continue

      presenter.buildHash = found.buildHash
      presenter.metadata = found.metadata
    }
    debug('end preloadFromManifest')
  }

  static async revalidatePresenters() {
    debug('start revalidatePresenters')
    for (const presenter of this.presenters) {
      presenter.revalidate()
    }

    await Promise.all(this.presenters.map((i) => i.metadataPromise))
    debug('end revalidatePresenters')
  }

  static async fullReload() {
    debug('start full reload')
    await this.registerRecords()

    await this.preloadFromManifest()

    await this.revalidatePresenters()

    this.pipeToManifest()

    await manifest.writeToFile()
  }

  static debouncedFullReload = debounce(this.fullReload, 150, { maxWait: 10000 })

  static async startDev() {
    debug('start dev')
    await this.fullReload()

    this.startWatching()
  }
}

class PresenterFile {
  constructor(
    public filePath: string,
    public importPath: string,
    public buildHash?: string
  ) {
    const file = path.parse(this.filePath)
    this.className = classNameString(file.name) // From File
    this.presenterId = new PresenterID(this.className).getID()
    this.fileName = file.name // From File
    this.relativeFilePath = this.filePath
    // .slice(PresenterManifestBuilder.presenterDir.length + 1) // user_presenter.ts
  }

  public className: string
  public presenterId: string
  public fileName: string
  public metadata?: PresenterMetadata
  public metadataPromise?: Promise<PresenterMetadata>
  public relativeFilePath: string

  revalidate() {
    this.metadataPromise = this.runValidation().then(() => this.metadata!)
  }

  private async runValidation() {
    debug(`revalidate ${this.presenterId} #${this.buildHash}`)
    const fileText = await fs.promises.readFile(this.filePath).then((i) => i.toString())
    const newHash = PresenterFile.getFileHash(fileText)

    if (newHash === this.buildHash) {
      debug(`revalidate skipped ${this.presenterId} #${this.buildHash}`)
      return
    }

    const source = PresenterManifestBuilder.project.addSourceFileAtPath(this.filePath)

    const cls = source.getClasses().find((i) => i.isDefaultExport())
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
          console.log(param.type)
          if (param.name === 'data') {
            param.purpose = 'bodyData'
          } else if (supportedParameterTypes.includes(param.type as any)) {
            param.purpose = 'parameter'
          } else {
            throw new Error(
              `Invalid parameter type "${param.type}", note that injecting cannot be done via parameters in presenter actions, use constructor @injects`
            )
          }
        }

        return param
      })

      presMetadata.methods.push(methodMetadata)
    }

    PresenterManifestBuilder.project.removeSourceFile(source)

    this.buildHash = newHash
    this.metadata = presMetadata

    debug(`revalidate end ${this.presenterId} #${this.buildHash}`)
  }

  static getFileHash(fileContent: string) {
    return createHash('sha1').update(fileContent).digest('hex')
  }
}
