import {
  $,
  Component,
  component$,
  createContextId,
  noSerialize,
  NoSerialize,
  useContext,
  useContextProvider,
  useOnWindow,
  useServerData,
  useStore,
  useTask$,
} from '@qwik.dev/core'
import type { QData } from '#classes/qwik/qwik_template'
import { getComponentQrl } from './utils'
import { useNavigate } from './use-navigate'
import { HeadElement } from '#classes/qwik/document_head'

type RouterStore = {
  loading: boolean
  ViewComponent: Component
  LayoutComponent: Component
  loaders: Record<string, any>
  navigationQueue: {
    href: string
    abort: NoSerialize<AbortController>
    startTime: number
    promise?: Promise<boolean> // true if rendered, false if cached or failed (if it fails, then it's removed from the queue)
    shouldRender: boolean
    replaceState: boolean
    data?: {
      View: Component
      Layout: Component
      qData: QData
    }
  }[]
  head: {
    elements: HeadElement[]
    title: string
  }
}
export type Route = RouterStore['navigationQueue'][number]

export const routerContext = createContextId<RouterStore>('app.router')

export function useRouterProvider() {
  const qData = useServerData<QData>('qData')
  const router = useStore<RouterStore>({
    loading: false,
    ViewComponent: noSerialize(qData?.route.template.view.Component),
    LayoutComponent: noSerialize(qData?.route.template.layout.Component),
    navigationQueue: [],
    loaders: qData?.loaders ?? {},
    head: qData?.route.head ?? {
      elements: [],
      title: '',
    },
  })

  useContextProvider(routerContext, router)
}

export const Router = component$(() => {
  const router = useContext(routerContext)

  const navigate = useNavigate()

  useOnWindow(
    'popstate',
    $(async () => {
      const url = new URL(window.location.href)

      await navigate(url.pathname + url.search, { replaceState: true })
    })
  )

  useTask$(({ track }) => {
    track(() => router.navigationQueue.map((r) => r.startTime))

    router.navigationQueue.forEach((r) => {
      if (r.promise) return
      if (r.shouldRender) router.loading = true

      r.promise = startRouteLoading(router, r)
    })
  })

  return (
    <router.LayoutComponent>
      <router.ViewComponent />
    </router.LayoutComponent>
  )
})

export const startRouteLoading = $(async (router: RouterStore, route: Route) => {
  try {
    const url = new URL(route.href, window.location.href)
    url.searchParams.append('q-data', '')

    const res = await fetch(url, {
      signal: route.abort?.signal,
    })

    const prefetchModules = res.headers.get('X-Prefetch-Modules')

    function tryJsonParse(): string[] {
      try {
        return typeof prefetchModules === 'string' ? JSON.parse(prefetchModules) : []
      } catch (e) {
        return []
      }
    }

    async function importDefault(path: string) {
      const module = await import(/* @vite-ignore */ path)

      return module.default
    }

    const modules = tryJsonParse()

    for (const path of modules) {
      try {
        importDefault(path) //
          .then((imp) => getComponentQrl(imp)?.resolve())
      } catch (e) {
        console.error('Error caught while prefetching modules:', e)
      }
    }

    const qData: QData = await res.json()

    const Layout = importDefault(qData.route.template.layout.modulePath)
    const Component = importDefault(qData.route.template.view.modulePath)

    await Promise.all([
      Layout.then((comp) => getComponentQrl(comp)?.resolve()),
      Component.then((comp) => getComponentQrl(comp)?.resolve()),
    ])

    const latestRoute = router.navigationQueue.at(-1)

    route.data = {
      View: await Component,
      Layout: await Layout,
      qData,
    }

    if (latestRoute === route && latestRoute.shouldRender) {
      await renderRoute(router, latestRoute)

      return true
    }
    return false
  } catch (e) {
    console.error('Route fetching failed:', e)

    const rIndex = router.navigationQueue.findIndex((i) => i === route)
    router.navigationQueue.splice(rIndex, 1)

    return false
  }
})

export const renderRoute = $((router: RouterStore, route: Route) => {
  if (!route.data) {
    console.error("Tried to render a route, which data wasn't loaded yet")
    return
  }
  const { View, Layout, qData } = route.data

  router.head = route.data.qData.route.head
  router.ViewComponent = View
  router.LayoutComponent = Layout
  router.loaders = qData.loaders

  const url = new URL(qData.route.location.path!, window.location.origin)
  url.searchParams.delete('q-data')
  if (route.replaceState) {
    window.history.replaceState({}, '', url)
  } else {
    window.history.pushState({}, '', url)
  }

  router.loading = false

  const index = router.navigationQueue.findIndex((r) => r === route)
  router.navigationQueue.splice(index, 1)
})

export function useHead() {
  const router = useContext(routerContext)

  return router.head
}
