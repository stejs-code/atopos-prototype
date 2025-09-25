import {
  $,
  Component,
  component$,
  createContextId,
  noSerialize,
  NoSerialize,
  PropsOf,
  QRL,
  Slot,
  useContext,
  useContextProvider,
  useOnWindow,
  useServerData,
  useStore,
  useTask$,
} from '@qwik.dev/core'
import type { QData } from '#classes/qwik/qwik_template'
import { QwikLoader } from '../../loaders-plugin/qwik_loader'
import { err } from 'neverthrow'

export function useLoader<T extends typeof QwikLoader>(
  loaderClass: T | string
): Readonly<Awaited<InstanceType<T>['data']>> {
  const loaderName = typeof loaderClass === 'string' ? loaderClass : loaderClass.name
  const router = useContext(routerContext)

  return router.loaders[loaderName]
}

type RouterStore = {
  loading: boolean
  ViewComponent: Component
  LayoutComponent: Component
  loaders: Record<string, any>
  navigationQueue: {
    href: string
    abort: NoSerialize<AbortController>
    startTime: number
    promise?: Promise<void>
    shouldRender: boolean
    replaceState: boolean
    data?: {
      View: Component
      Layout: Component
      qData: QData
    }
  }[]
}

export const routerContext = createContextId<RouterStore>('app.router')
export const routerTemplateContext = createContextId<RouterStore>('app.router.template')

/**
 * CRITICAL, WATCH FOR CHANGES IN CORE
 * @param c
 */
function getComponentQrl(c: unknown): QRL | undefined {
  const symbol = Object.getOwnPropertySymbols(c).find((i) => i.description == 'serializable-data')
  if (symbol) {
    return (c as any)?.[symbol]?.[0]
  }
}

export const Router = component$(() => {
  const qData = useServerData<QData>('qData')
  const router = useStore<RouterStore>({
    loading: false,
    ViewComponent: noSerialize(qData?.route.template.view.Component),
    LayoutComponent: noSerialize(qData?.route.template.layout.Component),
    navigationQueue: [],
    loaders: qData?.loaders ?? {},
  })

  useContextProvider(routerContext, router)

  const navigate = useNavigate()

  useOnWindow(
    'popstate',
    $(async () => {
      const url = new URL(window.location.href)
      console.log(url.pathname + url.search)
      await navigate(url.pathname + url.search, { replaceState: true })
    })
  )

  useTask$(({ track }) => {
    track(() => router.navigationQueue.map((r) => r.startTime))

    router.navigationQueue.forEach((r) => {
      if (r.promise) return
      if (r.shouldRender) router.loading = true

      r.promise = new Promise<void>(async (resolve, reject) => {
        try {
          const url = new URL(r.href, window.location.href)
          url.searchParams.append('q-data', '')

          const res = await fetch(url, {
            signal: r.abort?.signal,
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

          // await new Promise<void>((resolve) => setTimeout(resolve, 8000))
          const qData: QData = await res.json()

          const Layout = importDefault(qData.route.template.layout.modulePath)
          const Component = importDefault(qData.route.template.view.modulePath)

          Layout.then(async (comp) => {
            const qrl = getComponentQrl(comp)
            await qrl?.resolve()
            console.log('cap', qrl?.getCaptured())
            console.log('cap', qrl)
          })

          await Promise.all([
            Layout.then((comp) => getComponentQrl(comp)?.resolve()),
            Component.then((comp) => getComponentQrl(comp)?.resolve()),
          ])

          const latestRoute = router.navigationQueue.at(-1)

          r.data = {
            View: await Component,
            Layout: await Layout,
            qData,
          }

          if (latestRoute === r && latestRoute.shouldRender) {
            renderRoute(router, latestRoute)
          }

          resolve()
        } catch (e) {
          console.error('Route fetching failed:', e)
          resolve()

          const rIndex = router.navigationQueue.findIndex(i => i ===r)
          router.navigationQueue.splice(rIndex, 1)
        }
      })
    })
  })

  // useTask$(async ({ track }) => {
  // const key = track(tpl) + '-tpl'

  // const importer = views[key]
  // if (!importer) {
  //   return console.error(`No view named "${key}" found`)
  // }
  // const promise = importer()
  //
  // if (isServer) {
  //   await promise
  // } else {
  //   promise.then((module: any) => {
  //     Tpl.Component = module.default
  //   })
  // }
  // })
  // const Tpl = views[tpl.value + '-tpl'] as any
  // const comp = jsx(templateSig.value, {})

  return (
    <router.LayoutComponent>
      <router.ViewComponent />
    </router.LayoutComponent>
  )
})

export function renderRoute(router: RouterStore, route: RouterStore['navigationQueue'][number]) {
  if (!route.data) {
    console.error("Tried to render a route, which data wasn't loaded yet")
    return
  }
  const { View, Layout, qData } = route.data

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
}

type NavigateOptions = {
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

    console.log(JSON.parse(JSON.stringify(router.navigationQueue)))
  })
}

type LinkProps = PropsOf<'a'> & {}

export const Link = component$<LinkProps>((props) => {
  const { ...rest } = props
  const navigate = useNavigate()
  return (
    <a
      {...rest}
      preventdefault:click
      onMouseEnter$={async () => {
        await navigate(rest.href!, { justPrefetch: true })
      }}
      onClick$={async () => {
        await navigate(rest.href!)
      }}
    >
      <Slot />
    </a>
  )
})
