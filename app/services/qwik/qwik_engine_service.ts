import { AdoQwik } from '#services/qwik/index'
import vite from '@adonisjs/vite/services/main'
import { RenderResult, RenderToStreamOptions } from '@qwik.dev/core/server'
import { err, ok } from 'neverthrow'
import { StreamWriter } from '@qwik.dev/core/internal'
import app from '@adonisjs/core/services/app'
import { QwikDevToolsService } from '#services/qwik/qwik_dev_tools_service'

export class QwikEngineService {
  async renderToStream(data: AdoQwik.RenderData, stream: StreamWriter) {
    const module = await this.getModule()

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

  private async getModule(): Promise<typeof import('../../../src/entry.ssr.js')> {
    if (app.inDev) {
      const runner = await vite.createModuleRunner()

      try {

      return await runner.import('src/entry.ssr.tsx')
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log(e.cause)
        }
        throw e
      }
    } else {
      return await app.import('./server/build/entry.ssr.js')
    }
  }

  protected getBase() {
    if (app.inDev) {
      return '/'
    } else {
      return '/dist/build'
    }
  }
}

app.container.singleton(QwikEngineService, () => {
  return new QwikEngineService()
})
