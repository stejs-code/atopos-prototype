import {
  component$,
  createContextId,
  Signal,
  useComputed$,
  useContext,
  useContextProvider,
  useServerData,
  useSignal,
  useStore,
  useTask$,
} from '@qwik.dev/core'
import type { AdoQwik } from '#services/qwik'
import { views } from 'virtual:adonis-qwik-manifest'
import ATpl from '~/views/a-tpl.js'
import { Loaders } from '../../app/loader.manifest'
import type { QData } from '#classes/qwik/qwik_template'
import { QwikLoader } from '../../loaders-plugin/qwik_loader'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'
import { ImportInfo } from '../../loaders-plugin'
import { load } from 'hot-hook/loader'

// import ATpl from './a-tpl.js'
// import BTpl from './b-tpl.js'
//
// const tplRegistry = {
//   a: ATpl,
//   b: BTpl,
// }

export const loadersContext = createContextId<Record<string, any>>('app.loaders')

export function useLoadersProvider() {
  const qData = useServerData<QData>('qData')

  const loadersStore = useStore(qData?.loaders ?? {})

  useContextProvider(loadersContext, loadersStore)
  return loadersStore
}

export function useLoader<T extends typeof QwikLoader>(
  loaderClass: T | string
): Awaited<InstanceType<T>['data']> {
  const loaderName = typeof loaderClass === 'string' ? loaderClass : loaderClass.name
  const loaders = useContext(loadersContext)

  return loaders[loaderName];
}

export const Router = component$(() => {
  const qLoaders = useLoadersProvider()
  const qData = useServerData<QData>('qData')
  const tpl = useSignal<'a' | 'b'>('a')

  const Tpl = useStore<any>({
    Component: undefined,
    importUrl: 'no component',
  })

  const ldata = useLoader(QwikLocationLoader)

  useTask$(({ track }) => {
    const key = track(tpl) + '-tpl'

    const loader = views[key]
    if (!loader) {
      return console.error(`No view named "${key}" found`)
    }
    const promise = loader()
    // console.log({ promise })

    promise.then((module: any) => {
      Tpl.Component = module.default
    })
  })
  // const Tpl = views[tpl.value + '-tpl'] as any

  return (
    <div>
      {/*<ATpl/>*/}
      <pre>{JSON.stringify(ldata, null, 2)}</pre>
      <button onClick$={() => (tpl.value = tpl.value === 'a' ? 'b' : 'a')}>change tpl</button>
      <button onClick$={() => {
        qLoaders["QwikLocationLoader"] = {path: (Math.random() * 10000).toString()}
      }}>xxxx tpl</button>
      <Tpl.Component />
      {/*<pre>{JSON.stringify(sData, null, 2)}</pre>*/}
    </div>
  )
})

export function resolveNavigation(url: string) {
  // fetch()
}

type RouterStore = {}

const RouterContext = createContextId('RouterContext')
export function useRouterProvider(serverData) {
  const store = useStore({})
}

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
