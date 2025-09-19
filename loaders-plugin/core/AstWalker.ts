export type Visitor = (node: any) => void

export class AstWalker {
  static walk(node: any, visit: Visitor) {
    if (!node || typeof node !== 'object') return
    visit(node)
    for (const key in node) {
      const value = (node as any)[key]
      if (Array.isArray(value)) {
        for (const child of value) AstWalker.walk(child, visit)
      } else if (value && typeof value === 'object') {
        AstWalker.walk(value, visit)
      }
    }
  }
}
