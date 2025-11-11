import { defineAtopos } from '@atopos/core'

export const atopos = defineAtopos({
  debug: true,
  presentersSource: [{ dir: 'app/presenters', importPrefix: '#presenters/' }],
  router: () => import('#classes/dynamic_router'),
})
