import { component$, Slot } from '@qwik.dev/core'

export default component$(() => {
  return (
    <div title={"blank"}>

      <Slot />

    </div>
  )
})
