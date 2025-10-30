import { parseAsync } from 'oxc-parser'
// TODO: move to vite native parser

export class ParserFacade {
  async parse(filename: string, code: string, isTS: boolean) {
    const result: any = await parseAsync(filename, code, {
      sourceType: 'module',
      lang: isTS ? 'tsx' : 'jsx',
      range: true,
    })
    if (result.errors && result.errors.length) {
      const first = result.errors[0]

      throw new Error(
        `OXC parse error at ${first?.span ? `${first.span.start}..${first.span.end}` : 'unknown'}`
      )
    }
    return result.program
  }
}
