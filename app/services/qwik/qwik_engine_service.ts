import { AdoQwik } from '#services/qwik/index'
import vite from '@adonisjs/vite/services/main'
import { RenderResult, RenderToStreamOptions } from '@qwik.dev/core/server'
import { err, ok } from 'neverthrow'
import { StreamWriter } from '@qwik.dev/core/internal'
import app from '@adonisjs/core/services/app'
import { QwikDevToolsService } from '#services/qwik/qwik_dev_tools_service'
import { ModuleRunner } from 'vite/module-runner'

export class QwikEngineService {
  async renderToStream(data: AdoQwik.RenderData, stream: StreamWriter) {
    const module = await this.getEntryModule()

    const opts: RenderToStreamOptions = {
      stream: stream,
      base: this.getBase(),
      serverData: {
        ...data,
        location: {
          x: 'a',
        },
      },
    }

    const result = await this.runRenderFunction(module.default, opts)

    if (result.isErr()) {
      throw result.error
    }

    if (app.inDev) {
      const tools = await app.container.make(QwikDevToolsService)
      stream.write(tools.getSSREnd())
    }

    return result.value
  }

  private async runRenderFunction(
    func: (opts: RenderToStreamOptions) => Promise<RenderResult>,
    opts: RenderToStreamOptions
  ) {
    try {
      return ok(await func(opts))
    } catch (e) {
      if (e instanceof Error) {
        return err(e)
      }
      return err({
        message: 'Failed to render',
        error: e,
      })
    }
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
      return await app.import(`./server/${fileName}.js`)
    }
  }

  private getEntryModule(): Promise<typeof import('../../../src/entry.ssr.js')> {
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
  private async getRunner() {
    if (!this.runner) {
      this.runner = await vite.createModuleRunner()
      // optional: clean up on shutdown
      process.once('exit', () => this.runner?.close?.())
      process.once('SIGINT', () => {
        this.runner?.close?.()
        process.exit()
      })
    }
    return this.runner
  }
}

app.container.singleton(QwikEngineService, () => {
  return new QwikEngineService()
})
