import fs from 'node:fs'
import { PluginOption } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import qwikLoadersPlugin from './loaders-plugin'
import { registerEntryPoints } from './register_entry_points'

export default function atoposVite(): PluginOption {
  return [
    qwikLoadersPlugin(),
    registerEntryPoints({
      // dirs: atopos.serverLoadedViteDir,
      dirs: ['src/views', 'src/layouts'], // TODO must be configurable
    }),
    qwikVite({
      csr: false,
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
    return undefined
  }
}
