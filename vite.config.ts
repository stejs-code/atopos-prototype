import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import Inspect from 'vite-plugin-inspect'
import atoposVite from './atopos/vite/plugin'

export default defineConfig({
  base: '/dist/',

  publicDir: false,
  build: {
    copyPublicDir: false,
    outDir: 'public', // put build output here
    emptyOutDir: false, // don’t wipe the whole folder
    assetsDir: 'build', // images/fonts go here: public/dist/assets/
  },

  plugins: [
    Inspect({
      open: true,
    }),
    atoposVite(),
    tsconfigPaths({ root: '.' }),
  ],
})
