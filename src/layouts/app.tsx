import { component$, Slot } from '@qwik.dev/core'

import { Link } from '~/app/link'

export default component$(() => {
  return (
    <div>
      <h2>Nav:</h2>
      <ul>
        <li>
          <Link href="/user/detail?id=1">detail</Link>
        </li>
        <li>
          <Link href="/user/edit?id=1">edit</Link>
        </li>
      </ul>

      welcome to the app layout page.
      <Slot />
      endofapp
    </div>
  )
})
