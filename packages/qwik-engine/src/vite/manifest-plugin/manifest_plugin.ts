// import { PluginOption, ResolvedConfig } from 'vite'
// import { PresenterManifestBuilder } from '../../shared/manifest/manifest-builder'
//
// export default function adonisManifestPlugin(): PluginOption {
//   let config: ResolvedConfig
//
//   return {
//     name: 'vite-adonis-manifest',
//
//     configResolved(rConfig) {
//       config = rConfig
//     },
//
//     async buildStart() {
//       if (!config.isProduction) {
//         await startDev()
//       } else if (config.build.ssr) {
//         await buildProduction()
//       }
//     },
//   }
// }
//
// async function startDev() {
//   await PresenterManifestBuilder.loadAllEntries()
//
//   await PresenterManifestBuilder.pipeToManifest()
//
//   PresenterManifestBuilder.startWatching()
// }
//
// async function buildProduction() {
//   await PresenterManifestBuilder.loadAllEntries()
//
//   await PresenterManifestBuilder.emit()
// }
