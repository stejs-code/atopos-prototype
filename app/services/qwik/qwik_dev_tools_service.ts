import app from '@adonisjs/core/services/app'
import fs from 'fs'
import { VITE_ERROR_OVERLAY_STYLES } from '../../vite-error.js'

export class QwikDevToolsService {
  protected devTools: QwikPluginDevTools = {
    imageDevTools: false,
    clickToSource: ['Alt'],
  }

  protected srcDir = app.appRoot.pathname + '/src'

  public getSSREnd() {
    return `
      <style>${VITE_ERROR_OVERLAY_STYLES}</style>
      <script type="module" src="/dist/@vite/client"></script>
      ${this.devToolsHtml.errorHost}
      ${this.devToolsHtml.perfWarning}
      ${this.getDevQwikInspector()}
      `
  }


  private _devToolsHtml:
    | {
        clickToComponent: string
        errorHost: string
        imageDevTools: string
        perfWarning: string
      }
    | undefined

  protected get devToolsHtml() {
    if (!this._devToolsHtml) {
      const readDev = (file: string) => {
        return fs.readFileSync(app.makePath(`resources/dev/${file}`), 'utf8')
      }

      this._devToolsHtml = {
        clickToComponent: readDev('click-to-component.html'),
        errorHost: readDev('error-host.html'),
        imageDevTools: readDev('image-size-runtime.html'),
        perfWarning: readDev('perf-warning.html'),
      }
    }

    return this._devToolsHtml
  }

  protected getDevQwikInspector() {
    const qwikDevTools = {
      hotKeys: this.devTools.clickToSource ?? [],
      srcDir: new URL(this.srcDir.endsWith('/') ? this.srcDir : this.srcDir + '/', 'http://local.local').href,
    }

    return (
      `<script>
      globalThis.qwikdevtools = ${JSON.stringify(qwikDevTools)}
    </script>` +
      (this.devTools.imageDevTools ? this.devToolsHtml.imageDevTools : '') +
      (this.devTools.clickToSource ? this.devToolsHtml.clickToComponent : '')
    )
  }

}

app.container.singleton(QwikDevToolsService, () => {
  return new QwikDevToolsService()
})

interface QwikPluginDevTools {
  imageDevTools?: boolean | true
  clickToSource?: string[] | false
}
