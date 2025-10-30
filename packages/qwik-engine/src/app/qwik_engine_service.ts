import { RenderResult, RenderToStreamOptions, RenderToStreamResult } from '@builder.io/qwik/server'
import { StreamWriter } from '@builder.io/qwik'
import app from '@adonisjs/core/services/app'
import { ModuleRunner } from 'vite/module-runner'
import router from '@adonisjs/core/services/router'
import { ServerQwikManifest, symbolMapper } from '@builder.io/qwik/optimizer'
import { join } from 'node:path'
import { QwikDevToolsService } from './qwik_dev_tools_service'
import vite from '@adonisjs/vite/services/main'

export class QwikEngineService {
  async renderToStream(data: Record<any, any>, stream: StreamWriter) {
    const module = await this.getEntryModule()

    const opts: RenderToStreamOptions = {
      stream: stream,
      base: this.getBase(),
      symbolMapper: app.inDev ? symbolMapper : undefined,
      manifest: app.inDev ? this.getClientManifest() : undefined,
      serverData: {
        ...data,
        router: router,
        location: {
          x: 'a',
        },
      },
    }

    // const renderOpts: RenderToStreamOptions = {
    //   debug: true,
    //   locale: serverData.locale,
    //   stream: res,
    //   snapshot: !isClientDevOnly,
    //   manifest: isClientDevOnly ? undefined : manifest,
    //   symbolMapper: isClientDevOnly ? undefined : symbolMapper,
    //   serverData,
    //   containerAttributes: { ...serverData.containerAttributes },
    // }

    const result = await this.runRenderFunction(module.default, opts)

    if (app.inDev) {
      const tools = await app.container.make(QwikDevToolsService)
      stream.write(tools.getSSREnd())
    }

    return result
  }

  private async runRenderFunction(
    func: (opts: RenderToStreamOptions) => Promise<RenderResult>,
    opts: RenderToStreamOptions
  ) {
    return await func(opts)
  }

  /**
   *
   * @param fileName e.g. views/a-tpl for src/views/a-tpl.tsx
   * @private
   */
  public async getModule(fileName: string): Promise<any> {
    if (app.inDev) {
      const runner = await this.getRunner()

      try {
        return await runner.import(`src/${fileName}.tsx`)
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log(e.cause)
        }
        throw e
      }
    } else {
      return await app.import(`./server/src/${fileName}.js`)
    }
  }

  private getEntryModule(): Promise<EntryModule> {
    return this.getModule('entry.ssr')
  }

  protected getBase() {
    if (app.inDev) {
      return '/'
    } else {
      return '/dist/build'
    }
  }

  private runner?: ModuleRunner
  private viteRestartHandler?: () => void
  private async getRunner() {
    if (this.runner) return this.runner

    this.runner = await vite.createModuleRunner()

    const cleanup = () => {
      try {
        this.runner?.close?.()
      } catch {}
      this.runner = undefined
    }

    process.once('exit', cleanup)
    process.once('SIGINT', () => {
      cleanup()
      process.exit()
    })

    const server = vite.getDevServer?.()
    if (server && !this.viteRestartHandler) {
      this.viteRestartHandler = () => {
        cleanup()
      }

      const originalRestart = server.restart
      server.restart = (...args) => {
        if (this.viteRestartHandler) {
          this.viteRestartHandler()
        }
        return originalRestart.bind(server)(...args)
      }
    }

    return this.runner
  }

  cssImportedByCSS = new Set<string>()

  getClientManifest() {
    const manifest: ServerQwikManifest = {
      manifestHash: '',
      mapping: {},
      injections: [],
    }

    const server = vite.getDevServer()

    if (!server) return manifest

    const added = new Set()
    const CSS_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl', '.stylus']
    const JS_EXTENSIONS = /\.[mc]?[tj]sx?$/

    Array.from(server.moduleGraph.fileToModulesMap.entries()).forEach((entry) => {
      entry[1].forEach((v) => {
        const segment = v.info?.meta?.segment
        let url = v.url
        if (v.lastHMRTimestamp) {
          url += `?t=${v.lastHMRTimestamp}`
        }
        if (segment) {
          manifest.mapping[segment.name] = relativeURL(url, join(app.appRoot.href, 'src'))
        }

        const { pathId, query } = parseId(v.url)

        if (query === '' && CSS_EXTENSIONS.some((ext) => pathId.endsWith(ext))) {
          const isEntryCSS = v.importers.size === 0
          const hasCSSImporter = Array.from(v.importers).some((importer) => {
            const importerPath = (importer as typeof v).url || (importer as typeof v).file

            const isCSS = importerPath && CSS_EXTENSIONS.some((ext) => importerPath.endsWith(ext))

            if (isCSS && v.url) {
              this.cssImportedByCSS.add(v.url)
            }

            return isCSS
          })

          const hasJSImporter = Array.from(v.importers).some((importer) => {
            const importerPath = (importer as typeof v).url || (importer as typeof v).file
            return importerPath && JS_EXTENSIONS.test(importerPath)
          })

          if (
            (isEntryCSS || hasJSImporter) &&
            !hasCSSImporter &&
            !this.cssImportedByCSS.has(v.url) &&
            !added.has(v.url)
          ) {
            added.add(v.url)
            manifest.injections!.push({
              tag: 'link',
              location: 'head',
              attributes: {
                rel: 'stylesheet',
                href: `${this.getBase()}${url.slice(1)}`,
              },
            })
          }
        }
      })
    })

    manifest.manifestHash = hashCode(JSON.stringify(manifest))

    return manifest
  }
}

app.container.singleton(QwikEngineService, () => {
  return new QwikEngineService()
})

function relativeURL(url: string, base: string) {
  if (url.startsWith(base)) {
    url = url.slice(base.length)
    if (!url.startsWith('/')) {
      url = '/' + url
    }
  }
  return url
}

export function parseId(originalId: string) {
  const [pathId, query] = originalId.split('?')
  const queryStr = query || ''
  return {
    originalId,
    pathId,
    query: queryStr ? `?${query}` : '',
    params: new URLSearchParams(queryStr),
  }
}

export const hashCode = (text: string, hash: number = 0) => {
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return Number(Math.abs(hash)).toString(36)
}

export type EntryModule = {
  default: (opts: RenderToStreamOptions) => Promise<RenderToStreamResult>
}
