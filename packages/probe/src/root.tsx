import { component$ } from '@builder.io/qwik'
import { Router, useRouterProvider } from '../atopos/client/router'
import { RouterHead } from '~/components/router-head.js'

export default component$(() => {
  useRouterProvider()

  return (
    <>
      <head>
        <RouterHead />
      </head>
      <body>
        <Router />
      </body>
    </>
  )
})
