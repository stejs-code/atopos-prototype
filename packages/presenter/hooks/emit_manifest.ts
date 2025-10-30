import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { PresenterManifestBuilder } from '../src/index.js'

export default async function EmitManifest({ logger }: Parameters<AssemblerHookHandler>[0]) {
  await PresenterManifestBuilder.loadAllEntries()
  await PresenterManifestBuilder.emit()
  logger.info('Presenter Manifest built successfully')
}
