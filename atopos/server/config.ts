export type CommonPresenterRegistry = Record<
  any,
  {
    declaration: () => Promise<any>
    metadata: PresenterMetadata
  }
>

type MaybeArray<T> = T | Array<T>

export interface PresenterMetadata {
  methods: MethodMetadata[]
  className: string
  fileName: string
}

export interface MethodMetadata {
  parameters: ParameterMetadata[]
  name: string
  purpose: 'unknown' | 'action'
}

export interface ParameterMetadata {
  name: string
  type: string
  optional: boolean
  purpose: 'parameter' | 'bodyData'
}

export type AtoposUserConfig = {
  presentersDir: MaybeArray<string>
  serverLoadedViteDir: MaybeArray<string>

  build?: {
    baseDir?: string // "build"
    serverDir?: string // "server"
    /**
     * Sets the path to the atopos manifest inside the production build folder
     * @default atopos.manifest.json
     */
    manifestPath: string // "manifest.atopos.json"
  }
}

export type AtoposConfig = {
  presentersDir: string[]
  serverLoadedViteDir: string[]

  build: {
    baseDir: string
    serverDir: string
    manifestPath: string
  }
}
function toArray<T>(input: MaybeArray<T>): T[] {
  return Array.isArray(input) ? input : [input]
}

export function defineConfig(config: AtoposUserConfig): AtoposConfig {
  return {
    ...config,
    presentersDir: toArray(config.presentersDir),
    serverLoadedViteDir: toArray(config.serverLoadedViteDir),

    build: {
      baseDir: config.build?.baseDir ?? 'build',
      serverDir: config.build?.serverDir ?? 'server',
      manifestPath: config.build?.manifestPath ?? 'atopos.manifest.json',
    },
  }
}
