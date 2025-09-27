import { QwikLoader } from '../../../../atopos/vite/loaders-plugin/qwik_loader.js'


// type Arguments = Parameters<(testText: string) => void>

export default class QwikLocationLoader extends QwikLoader {
  load() {
    return {
      path: this.httpContext.request.url(false)
    }
  }
}

