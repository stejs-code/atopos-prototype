import Root from './root.js'
import { renderToStream, RenderToStreamOptions } from '@builder.io/qwik/server'

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, opts)
}
