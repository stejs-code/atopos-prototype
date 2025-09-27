import fs from 'node:fs'
import { PluginOption } from 'vite'
import registerEntryPoints from './register-entry-points'
import { qwikVite } from '@qwik.dev/core/optimizer'
import qwikLoadersPlugin from './loaders-plugin'
import { atopos } from '#config/atopos.js'

export default function atoposVite(): PluginOption {
  return [
    qwikLoadersPlugin(),
    registerEntryPoints({
      dirs: atopos.serverLoadedViteDir,
    }),
    qwikVite({
      devSsrServer: false,
      ssr: {
        manifestInput: loadQwikManifest(),
      },
    }),
  ]
}

function loadQwikManifest() {
  try {
    return JSON.parse(fs.readFileSync('public/dist/q-manifest.json').toString('utf-8'))
  } catch (e) {
    return {}
  }
}
