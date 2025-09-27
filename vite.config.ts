import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import tailwindcss from '@tailwindcss/vite'
import atoposVite from './atopos/vite/plugin'
import tsconfigPaths from 'vite-tsconfig-paths'

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
    tailwindcss(),
    atoposVite(),
    tsconfigPaths({ root: '.' }),
  ],
})
