import { defineConfig } from 'vite'
import { qwikVite } from '@qwik.dev/core/optimizer'
import * as fs from 'node:fs'
import tsconfigPaths from 'vite-tsconfig-paths'
import { vitePlugin } from './bin/vite-plugin'
import { qwikLoadersPlugin } from './loaders-plugin'
import Inspect from 'vite-plugin-inspect'


export default defineConfig({
  base: '/dist/',
  server: {
    hmr: false,
  },
  publicDir: false,
  build: {
    minify: false,
    manifest: true,
    copyPublicDir: false,
    outDir: 'public', // put build output here
    emptyOutDir: false, // don’t wipe the whole folder
    assetsDir: 'build', // images/fonts go here: public/dist/assets/
    rollupOptions: {
      output: {
        entryFileNames: 'build/[name].js',
        chunkFileNames: 'build/[name]-[hash].js',
        assetFileNames: ({ names }) => {
          // leave images, fonts, css in assets/
          if (/\.(gif|jpe?g|png|svg|ico|webp|woff2?|ttf|eot)$/.test(names[0] ?? '')) {
            return 'assets/[name]-[hash][extname]'
          }
          // everything else (JS/CSS chunks) in build/
          return 'build/[name]-[hash][extname]'
        },
      },
    },
  },

  plugins: [
    Inspect({
      open: true
    }),
    qwikLoadersPlugin(),
    qwikVite({
      devSsrServer: false,
      ssr: {
        manifestInput: loadManifest(),
      },
    }),
    tsconfigPaths({ root: '.' }),
    vitePlugin(),
    // adonisjs({
    //   /**
    //    * Entrypoints of your application. Each entrypoint will
    //    * result in a separate bundle.
    //    */
    //   entrypoints: ['resources/js/app.js'],
    //
    //   /**
    //    * Paths to watch and reload the browser on file change
    //    */
    //   reload: ['resources/views/**/*.edge'],
    // }),
  ],
})

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync('public/dist/q-manifest.json').toString('utf-8'))
  } catch (e) {
    return {}
  }
}
