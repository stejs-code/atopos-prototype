import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
// import fs from 'fs'
// import path from 'node:path'

export default async function QwiCleanupBuild({ logger:_ }: Parameters<AssemblerHookHandler>[0]) {
  // const directories = [
  //   './server',
  //   './public/build',
  //   './public/.vite',
  //   './public/assets',
  //   './public/q-manifest.json',
  // ]
  //
  // for (const rmLocation of directories) {
  //   logger.info(`Deleting ${rmLocation}`)
  //   await fs.promises.rm(rmLocation, { recursive: true, force: true })
  // }
  // logger.info(`Copying contents of ./dist to ./build/public`)
  // const entries = await fs.promises.readdir('./dist')
  // await Promise.all(entries.map(async (entry) => {
  //   await fs.promises.cp(path.join('./dist', entry), path.join('./build/public', entry), {
  //     recursive: true,
  //     force: true,
  //   })
  //   logger.info(`${entry} copied`)
  // }))
}
