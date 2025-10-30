import { createBuilder } from 'vite'
import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { registerEntryPoints } from '../src/vite/register_entry_points'

export default async function BuildViteServer({ logger }: Parameters<AssemblerHookHandler>[0]) {
  logger.info('building server with vite')
  console.log(registerEntryPoints)
  const builder = await createBuilder(
    {
      define: {
        'import.meta.env.DEV': false,
        'import.meta.env.PROD': true,
      },
      build: {
        ssr: 'src/entry.ssr.tsx',
        minify: false,
        outDir: 'server',
      },
    },
    null
  )

  await builder.buildApp()
}
