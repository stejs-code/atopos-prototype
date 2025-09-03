import { defineConfig } from 'vite'
import { qwikVite } from '@qwik.dev/core/optimizer'
import * as fs from 'node:fs'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  base: '/dist/',
  server: {
    hmr: false,
  },
  publicDir:false,
  build: {
    manifest: true,
    copyPublicDir: false,
    outDir: 'public',   // put build output here
    emptyOutDir: false,      // don’t wipe the whole folder
    assetsDir: 'build',     // images/fonts go here: public/dist/assets/
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
        }
      }
    }
  },

  plugins: [
    tsconfigPaths({ root: '.' }),
    qwikVite({
      devSsrServer: false,
      ssr: {
        manifestInput: loadManifest()
      }
    }),
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

function loadManifest(){
  try {
    const str = fs.readFileSync('public/dist/q-manifest.json').toString("utf-8")

    return JSON.parse(str)
  } catch (e) {
    console.log("EMTRU SSR AMNIFEST")
    return {}
  }
}
