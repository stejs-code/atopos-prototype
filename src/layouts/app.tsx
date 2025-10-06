import { component$, Slot, useSignal } from '@qwik.dev/core'

import { Link } from '../../atopos/client/link'

export default component$(() => {
  const countSig = useSignal(1)
  return (
    <div class="container">
      <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-start">
          <div class="dropdown text-accent-content/30 bg-accent-content/10 bg-accent text-accent-content/10 btn-dash">
            <div tabIndex={0} role="button" class="btn btn-ghost lg:hidden group-focus-visible text-red-500 shadow-base-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {' '}
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />{' '}
              </svg>
            </div>
            <ul
              tabIndex={0}
              class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow t tex"
            >
              <li>
                <Link href="/user/detail?id=125">
                  detail
                </Link>
              </li>
              <li>
                <Link href="/user/edit?id=1">edit</Link>
              </li>
            </ul>
          </div>
          <Link class="btn btn-ghost text-xl" href={'/'}>
            daisyUI
          </Link>
        </div>
        <div class="navbar-center hidden lg:flex">
          <ul class="menu menu-horizontal px-1">
            <li>
              <Link n:href={'User:detail'} n:params={{ id: 4 }}>
                detail
              </Link>
            </li>
            <li>
              <Link n:href={'User:edit'} n:params={{ id: 4 }}>
                edit
              </Link>
            </li>
          </ul>
        </div>
        <div class="navbar-end"></div>
      </div>
      <button class={'btn btn-primary'} onClick$={() => countSig.value++}>
        {countSig.value}
      </button>
      <Slot />
      endofapp
    </div>
  )
})
