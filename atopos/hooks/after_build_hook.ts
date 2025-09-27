import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import fs from 'fs'
import { PresenterManifestBuilder } from '../shared/manifest/manifest-builder.js'

export default async function AtoposAfterBuild({ logger }: Parameters<AssemblerHookHandler>[0]) {

  await PresenterManifestBuilder.loadAllEntries()
  await PresenterManifestBuilder.emit()

  const directories = [
    './server',
    './public/dist',
  ]

  for (const rmLocation of directories) {
    logger.info(`Deleting ${rmLocation}`)
    await fs.promises.rm(rmLocation, { recursive: true, force: true })
  }
}
