import { MaybeArray } from '../utils/index.js'
import { DynamicRouter } from '../presenter/index.js'

export type AtoposConfigInput = {
  // presentersDir: MaybeArray<string>
  debug?: boolean
  presentersSource: MaybeArray<
    Partial<PresenterSource> & Omit<PresenterSource, 'removeExtensionInImport'>
  >
  router?: () => Promise<{ default: typeof DynamicRouter }>

  build?: {
    baseDir?: string // "build"
    serverDir?: string // "server"
    /**
     * Sets the path to the atopos manifest inside the production build folder
     */
    manifestPath: string // ".adonis/atopos_manifest.json"
  }
}

export type AtoposConfig = {
  debug: boolean
  presentersSource: PresenterSource[]
  router: (() => Promise<{ default: typeof DynamicRouter }>) | null

  build: {
    baseDir: string
    serverDir: string
    manifestPath: string
  }
}

export function defineAtopos(input: AtoposConfigInput): AtoposConfig {
  return {
    debug: input.debug ?? false,
    router: input.router ?? null,
    presentersSource: [input.presentersSource]

      .flat()
      .map((i) => ({ ...i, removeExtensionInImport: i.removeExtensionInImport ?? true })),
    build: {
      baseDir: input.build?.baseDir ?? 'build',
      serverDir: input.build?.serverDir ?? 'server',
      manifestPath: input.build?.manifestPath ?? '.adonis/atopos_manifest.json',
    },
  }
}

export type PresenterSource = {
  dir: string
  importPrefix: string
  /**
   * @default true
   */
  removeExtensionInImport: boolean
}
