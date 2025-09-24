import {
  $,
  Component,
  component$,
  createContextId,
  jsx,
  noSerialize,
  NoSerialize,
  PropsOf,
  QRL,
  Signal,
  Slot,
  useContext,
  useContextProvider,
  useServerData,
  useSignal,
  useStore,
  useTask$,
} from '@qwik.dev/core'
import type { QData } from '#classes/qwik/qwik_template'
import { QwikLoader } from '../../loaders-plugin/qwik_loader'
import {
  _getContextContainer,
  _getContextElement,
  _waitUntilRendered,
} from '@qwik.dev/core/internal'

// import ATpl from './a-tpl.js'
// import BTpl from './b-tpl.js'
//
// const tplRegistry = {
//   a: ATpl,
//   b: BTpl,
// }

// export const loadersContext = createContextId<Record<string, any>>('app.loaders')
//
// export function useLoadersProvider() {
//   const qData = useServerData<QData>('qData')
//
//   const loadersStore = useStore(qData?.loaders ?? {})
//
//   useContextProvider(loadersContext, loadersStore)
//   return loadersStore
// }

export function useLoader<T extends typeof QwikLoader>(
  loaderClass: T | string
): Readonly<Awaited<InstanceType<T>['data']>> {
  const loaderName = typeof loaderClass === 'string' ? loaderClass : loaderClass.name
  const router = useContext(routerContext)

  return router.loaders[loaderName]
}

type RouterStore = {
  loading: boolean
  Template: Component
  loaders: Record<string, any>
  navigationQueue: {
    href: string
    abort: NoSerialize<AbortController>
    startTime: number
    promise?: Promise<void>
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
  const templateSig = useSignal(noSerialize(qData?.route.template.Component))
  const router = useStore<RouterStore>({
    loading: false,
    Template: noSerialize(qData?.route.template.Component),
    navigationQueue: [],
    loaders: qData?.loaders ?? {},
  })

  useContextProvider(routerTemplateContext, templateSig)
  useContextProvider(routerContext, router)

  useTask$(({ track }) => {
    track(() => router.navigationQueue.map((r) => r.startTime))

    router.navigationQueue.forEach((r) => {
      if (r.promise) return
      router.loading = true

      r.promise = new Promise<void>(async (resolve, reject) => {
        const url = new URL(r.href, window.location.href)
        url.searchParams.append('q-data', '')

        const res = await fetch(url, {
          signal: r.abort?.signal,
        })

        const prefetchModules = res.headers.get('X-Prefetch-Modules')
        const modules = typeof prefetchModules === 'string' ? JSON.parse(prefetchModules) : []
        console.log(modules)
        modules.forEach((path: string) => import(/* @vite-ignore */ path))

        // await new Promise<void>((resolve) => setTimeout(resolve, 8000))
        const qData: QData = await res.json()

        const Component = await import(/* @vite-ignore */ qData.route.template.modulePath).then(
          (r) => r.default
        )

        await getComponentQrl(Component)?.resolve()

        if (router.navigationQueue.at(-1)?.startTime === r.startTime) {
          spaRender(router, Component, qData, templateSig)
        }
        resolve()
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
    <div>
      <p>state: {router.loading ? 'loading...' : 'loaded'}</p>
      <pre>{JSON.stringify(router.loaders, null, 2)}</pre>
      <button
        onClick$={() => {
          // @ts-ignore
          router.loaders['QwikLocationLoader'] = { path: (Math.random() * 10000).toString() }
        }}
      >
        xxxx tpl
      </button>

      <router.Template />

      <Link href="/user/detail?id=1">detail</Link>
      <Link href="/user/edit?id=1">edit</Link>
      {/*<pre>{JSON.stringify(sData, null, 2)}</pre>*/}
    </div>
  )
})

export function spaRender(
  router: RouterStore,
  Template: Component,
  qData: QData,
  templateSig: Signal
) {
  console.log('laoded', Template, qData)
  router.Template = Template
  router.loaders = qData.loaders

  // templateSig.force()
  // _waitUntilRendered(_getContextElement() as any).then(() => {
  //
  router.loading = false
  // })
}

export function useNavigate() {
  const router = useContext(routerContext)
  return $((href: string) => {
    router.navigationQueue.push({
      href,
      abort: noSerialize(new AbortController()),
      startTime: Date.now(),
    })
  })
}

type LinkProps = PropsOf<'a'> & {}

export const Link = component$<LinkProps>((props) => {
  const { ...rest } = props
  const navigate = useNavigate()
  return (
    <a
      {...rest}
      onMouseEnter$={() => {}}
      preventdefault:click
      onClick$={() => {
        navigate(rest.href!)
      }}
    >
      <Slot />
    </a>
  )
})

// export function resolveNavigation(url: string) {
//   // fetch()
// }
//
// type RouterStore = {}
//
// const RouterContext = createContextId('RouterContext')
// export function useRouterProvider(serverData) {
//   const store = useStore({})
// }

// import { component$, createContextId, useServerData, useSignal, useStore } from '@qwik.dev/core'
// import type { AdoQwik } from '#services/qwik'
// import ATpl from './a-tpl.js'
// import BTpl from './b-tpl.js'
//
// const tplRegistry = {
//   a: ATpl,
//   b: BTpl,
// }
//
// export const Router = component$(() => {
//   const sData = useServerData<AdoQwik.RenderData>('location')
//   console.log(sData)
//   const tpl = useSignal<keyof typeof tplRegistry>('a')
//   const Tpl = tplRegistry[tpl.value] as any
//
//   return (
//     <div>
//       <button onClick$={() => (tpl.value = tpl.value === 'a' ? 'b' : 'a')}>change tpl</button>
//       <Tpl/>
//       <pre>{JSON.stringify(sData, null, 2)}</pre>
//     </div>
//   )
// })
//
// type RouterStore = {}
//
// const RouterContext = createContextId('RouterContext')
// export function useRouterProvider(serverData: ServerData) {
//   const store = useStore({})
// }
