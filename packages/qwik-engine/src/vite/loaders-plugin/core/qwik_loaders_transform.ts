import MagicString from 'magic-string'
import type { TransformResult } from '../types'
import { ParserFacade } from './parser_facade'
import { ImportRegistry } from './import_registry'
import { CallTransformer } from './call_transformer'
import { ImportRewriter } from './import_rewriter'

export class QwikLoadersTransform {
  private parser = new ParserFacade()

  async run(filename: string, code: string): Promise<TransformResult | null> {
    const isTS = /\.(ts|tsx)$/.test(filename)
    const program = await this.parser.parse(filename, code, isTS)
    const ms = new MagicString(code)

    const registry = new ImportRegistry(program, code)
    const callTx = new CallTransformer(program, registry, ms)
    const changed = callTx.apply()
    if (!changed) return null

    const importTx = new ImportRewriter(registry, ms)
    importTx.apply()

    return {
      code: ms.toString(),
      map: ms.generateMap({ source: filename, hires: true, includeContent: true }) as any,
    }
  }
}
