import { createBuilder } from 'vite'
import type { AssemblerHookHandler } from '@adonisjs/core/types/app'

export default async function QwiServerBuild({ logger }: Parameters<AssemblerHookHandler>[0]) {
  logger.info('building server with vite')
  const builder = await createBuilder({
    define: {
      'import.meta.env.DEV': false,
      'import.meta.env.PROD': true,
    },
    build: {
      // ssr: true,
      minify:false,
      ssr: 'src/entry.ssr.tsx',
      outDir: 'server',
    },
  }, null)

  await builder.buildApp()

}
