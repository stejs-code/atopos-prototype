import { component$, useSignal } from '@qwik.dev/core'
import { Router } from '~/app/router'

export default component$(() => {
  const count = useSignal(4)
  return (
    <>
      <head></head>
      <body>
        <Router/>
        <h1>hi, from adonis qwik</h1>
        <p>text {count.value}</p>e
        <button onClick$={() => count.value++}>
          clicm meaaaaaa
        </button>
      </body>
    </>
  )
})
