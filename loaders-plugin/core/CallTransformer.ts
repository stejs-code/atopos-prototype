import MagicString from 'magic-string'
import { AstWalker } from './AstWalker'
import type { ImportRegistry } from './ImportRegistry'

export class CallTransformer {
  private readonly program: any
  private registry: ImportRegistry
  private ms: MagicString
  private changed = false

  constructor(program: any, registry: ImportRegistry, ms: MagicString) {
    this.program = program
    this.registry = registry
    this.ms = ms
  }

  apply(): boolean {
    AstWalker.walk(this.program, (node) => {
      if (
        node?.type === 'CallExpression' &&
        node.callee?.type === 'Identifier' &&
        node.callee.name === 'useLoader' &&
        node.arguments?.length === 1
      ) {
        const arg = node.arguments[0]
        if (arg?.type === 'Identifier') {
          const info = this.registry.getInfo(arg.name)
          if (!info) return
          const replacement = this.buildLoaderTransform(arg.name)
          this.ms.overwrite(node.start, node.end, replacement)
          this.registry.markSpecifierForRemoval(info)
          this.changed = true
          return
        }
        if (
          arg?.type === 'MemberExpression' &&
          !arg.computed &&
          arg.object?.type === 'Identifier' &&
          arg.property?.type === 'Identifier'
        ) {
          const importPath = this.registry.getNamespacePath(arg.object.name)
          if (!importPath) return
          const replacement = this.buildLoaderTransform(arg.property.name)
          this.ms.overwrite(node.start, node.end, replacement)
          this.changed = true
        }
      }
    })
    return this.changed
  }

  // private buildObjectCall(importPath: string, symbol: string) {
  //   return `useLoaderTransform({ importPath: ${JSON.stringify(importPath)}, symbol: ${JSON.stringify(symbol)} })`
  // }

  private buildLoaderTransform(className:string) {
    return `useLoader("${className}")`
  }
}
