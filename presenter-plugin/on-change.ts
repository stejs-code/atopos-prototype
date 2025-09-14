import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { PresenterManifestBuilder } from './manifest-builder.js'

export default async function PresentersOnDev(params: Parameters<AssemblerHookHandler>[0]) {
  console.log(params)
}
