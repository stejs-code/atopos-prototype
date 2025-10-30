import type { ImportInfo } from '../types'

export class ImportRegistry {
  private program: any
  private code: string
  private localToInfo = new Map<string, ImportInfo>()
  private declToAllSpecs = new Map<any, any[]>()
  private declToKeptSpecs = new Map<any, any[]>()
  private nsToPath = new Map<string, string>()

  constructor(program: any, code: string) {
    this.program = program
    this.code = code
    this.build()
  }

  private build() {
    for (const node of this.program.body as any[]) {
      if (node.type !== 'ImportDeclaration') continue
      const importPath: string = node.source.value
      const specs: any[] = node.specifiers ?? []
      this.declToAllSpecs.set(node, specs)
      this.declToKeptSpecs.set(node, [...specs])

      for (const spec of specs) {
        if (spec.type === 'ImportDefaultSpecifier') {
          this.localToInfo.set(spec.local.name, {
            importPath,
            symbol: 'default',
            kind: 'default',
            importDecl: node,
            spec,
          })
        } else if (spec.type === 'ImportSpecifier') {
          const imported =
            spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value
          this.localToInfo.set(spec.local.name, {
            importPath,
            symbol: imported,
            kind: 'named',
            importDecl: node,
            spec,
          })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          this.localToInfo.set(spec.local.name, {
            importPath,
            symbol: '*',
            kind: 'namespace',
            importDecl: node,
            spec,
          })
          this.nsToPath.set(spec.local.name, importPath)
        }
      }
    }
  }

  getInfo(localName: string) {
    return this.localToInfo.get(localName)
  }
  getNamespacePath(nsLocal: string) {
    return this.nsToPath.get(nsLocal)
  }
  markSpecifierForRemoval(info: ImportInfo) {
    const kept = this.declToKeptSpecs.get(info.importDecl)
    if (!kept) return
    const idx = kept.indexOf(info.spec)
    if (idx !== -1) kept.splice(idx, 1)
  }
  *keptSpecifiersByDecl() {
    yield* this.declToKeptSpecs.entries()
  }
  getAllSpecsForDecl(decl: any) {
    return this.declToAllSpecs.get(decl) || []
  }
  getSource() {
    return this.code
  }
}
