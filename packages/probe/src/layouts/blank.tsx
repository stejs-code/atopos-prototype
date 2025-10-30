import { component$, Slot } from '@builder.io/qwik'

export default component$(() => {
  return (
    <div title={"blank"}>

      <Slot />

    </div>
  )
})
