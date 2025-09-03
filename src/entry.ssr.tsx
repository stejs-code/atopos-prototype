import Root from './root.js'
import { renderToStream, RenderToStreamOptions } from '@qwik.dev/core/server'

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, opts)
}
