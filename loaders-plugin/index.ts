import type { Plugin } from 'vite'
import { QwikLoadersTransform } from './core/QwikLoadersTransform'

export function qwikLoadersPlugin(): Plugin {
  const engine = new QwikLoadersTransform()
  return {
    name: 'adonis-qwik-loaders',
    enforce: 'pre',


    config(config) {
      // Add the SSR-entry plugin in front of everything else
      // so it runs before other config transforms
      // config.plugins = [
      //   ssrTemplatesEntrypoint({ dir:"src/views"}),
      //   ...(config.plugins ?? []),
      // ];
      // console.log(config.plugins)

      return config;
    },

    async transform(code, id) {
      if (!/\.(m?[jt]sx?)$/.test(id)) return null
      if (!code.includes('useLoader(')) return null
      try {
        const result = await engine.run(id, code)
        if (result) return { code: result.code, map: result.map }

        return null
      } catch (err) {
        this.warn(`[adonis-qwik-loaders] Failed to transform ${id}: ${String(err)}`)
        return null
      }
    },
  }
}

export default qwikLoadersPlugin
