import { $, noSerialize, useContext } from '@qwik.dev/core'
import { renderRoute, routerContext } from './router'

export type NavigateOptions = {
  justPrefetch?: boolean
  replaceState?: boolean
}

export function useNavigate() {
  const router = useContext(routerContext)
  return $((href: string, opts?: NavigateOptions) => {
    const fromQueue = router.navigationQueue.find((r) => {
      return !r.shouldRender && r.href === href && r.promise
    })

    if (fromQueue && !opts?.justPrefetch) {
      router.loading = true

      if (!fromQueue.shouldRender) {
        fromQueue.shouldRender = true
        renderRoute(router, fromQueue)
      }
    } else if (!fromQueue) {
      router.navigationQueue.push({
        href,
        replaceState: !!opts?.replaceState,
        abort: noSerialize(new AbortController()),
        startTime: Date.now(),
        shouldRender: !opts?.justPrefetch,
      })
    }
  })
}
