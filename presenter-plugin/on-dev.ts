import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { PresenterManifestBuilder } from './manifest-builder.js'

export default async function PresentersOnDev({  }: Parameters<AssemblerHookHandler>[0]) {
  await PresenterManifestBuilder.loadAllEntries()

  await PresenterManifestBuilder.emit()

  PresenterManifestBuilder.startWatching()
}
