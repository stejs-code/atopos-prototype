import MagicString from 'magic-string'
import type { ImportRegistry } from './ImportRegistry'

export class ImportRewriter {
  private registry: ImportRegistry
  private ms: MagicString

  constructor(registry: ImportRegistry, ms: MagicString) {
    this.registry = registry
    this.ms = ms
  }

  apply() {
    const source = this.registry.getSource()
    for (const [decl, keptSpecs] of this.registry.keptSpecifiersByDecl()) {
      const allSpecs = this.registry.getAllSpecsForDecl(decl)
      if (keptSpecs.length === allSpecs.length) continue

      if (keptSpecs.length === 0) {
        let end = decl.end
        if (source[end] === '\n') end += 1
        this.ms.remove(decl.start, end)
        continue
      }

      const importPath = decl.source.value as string
      const defaultSpec = keptSpecs.find((sp: any) => sp.type === 'ImportDefaultSpecifier')
      const nsSpec = keptSpecs.find((sp: any) => sp.type === 'ImportNamespaceSpecifier')
      const namedSpecs = keptSpecs.filter((sp: any) => sp.type === 'ImportSpecifier')

      let rebuilt = 'import '
      if (nsSpec) {
        rebuilt += `* as ${nsSpec.local.name} from ${JSON.stringify(importPath)};`
      } else {
        const parts: string[] = []
        if (defaultSpec) parts.push(defaultSpec.local.name)
        if (namedSpecs.length) {
          const inner = namedSpecs
            .map((sp: any) => {
              const importedName = sp.imported.type === 'Identifier' ? sp.imported.name : sp.imported.value
              return importedName === sp.local.name ? sp.local.name : `${importedName} as ${sp.local.name}`
            })
            .join(', ')
          parts.push(`{ ${inner} }`)
        }
        rebuilt += parts.join(', ') + ` from ${JSON.stringify(importPath)};`
      }
      this.ms.overwrite(decl.start, decl.end, rebuilt)
    }
  }
}
