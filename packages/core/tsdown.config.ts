import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/atopos_provider.ts'],
  outDir: 'dist/src',
})
