import { component$ } from '@qwik.dev/core'
import { Router } from '../atopos/client/router'

export default component$(() => {
  return (
    <>
      <head></head>
      <body>
        <Router/>
      </body>
    </>
  )
})
