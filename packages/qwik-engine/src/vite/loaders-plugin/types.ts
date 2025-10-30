export interface ImportInfo {
  importPath: string
  symbol: string
  kind: 'default' | 'named' | 'namespace'
  importDecl: any
  spec: any
}

export interface TransformResult {
  code: string
  map: any | null
}
