import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import fs from 'fs'

export default async function QwiCleanupBuild({ logger }: Parameters<AssemblerHookHandler>[0]) {
  const directories = [
    './server',
    './public/dist',
  ]

  for (const rmLocation of directories) {
    logger.info(`Deleting ${rmLocation}`)
    await fs.promises.rm(rmLocation, { recursive: true, force: true })
  }
}
