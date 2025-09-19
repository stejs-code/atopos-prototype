import type { Plugin } from 'vite'
import { QwikLoadersTransform } from './core/QwikLoadersTransform'

export function qwikLoadersPlugin(): Plugin {
  const engine = new QwikLoadersTransform()
  return {
    name: 'adonis-qwik-loaders',
    enforce: 'pre',

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
