export interface JsonManifest {
  presenters: Record<string, JsonPresenterRecord>
}

export interface PresenterRecord {
  metadata: PresenterMetadata
  declaration: () => Promise<any>
  importPath: string
  buildHash: string
}

export interface JsonPresenterRecord {
  metadata: PresenterMetadata
  importPath: string
  buildHash: string
}

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
