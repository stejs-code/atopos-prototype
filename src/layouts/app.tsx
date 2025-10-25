import { component$, Slot } from '@qwik.dev/core'

import { Link } from '../../atopos/client/link'

export default component$(() => {

  return (
    <div class="container">
      <ul tabIndex={0} class="list-disc">
        <li>
          <Link href="/user/detail?id=125">detail</Link>
        </li>
        <li>
          <Link href="/user/edit?id=1">edit</Link>
        </li>
      </ul>
      <Slot />
      endofapp
    </div>
  )
})
