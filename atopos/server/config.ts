import { Presenter } from './presenter.js'

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

  router: Record<string, NamedRoute>
}

export interface NamedRoute {
  presenterId: string
  action: string
  params: Record<string, any>
}

export type AtoposConfig = {
  presentersDir: string[]
  serverLoadedViteDir: string[]

  build: {
    baseDir: string
    serverDir: string
    manifestPath: string
  }

  router: Record<string, NamedRoute>
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

export function namedRoute<T extends typeof Presenter>(
  presenter: T,
  action: keyof InstanceType<T>,
  params?: Record<string, any>
) {
  return {
    presenterId: Presenter.parsePresenterId(presenter.name),
    action: Presenter.parseActionId(action.toString()),
    params: params ?? {}
  }
}
