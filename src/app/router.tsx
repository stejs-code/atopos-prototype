import { component$, createContextId, useServerData, useSignal, useStore, useTask$ } from '@qwik.dev/core'
import type { AdoQwik } from '#services/qwik'
import { views } from 'virtual:adonis-qwik-manifest'
import ATpl from "~/views/a-tpl.js";

// import ATpl from './a-tpl.js'
// import BTpl from './b-tpl.js'
//
// const tplRegistry = {
//   a: ATpl,
//   b: BTpl,
// }

export const Router = component$(() => {
  const sData = useServerData<AdoQwik.RenderData>('location')
  // console.log(sData)
  // console.log(views)
  const tpl = useSignal<'a' | 'b'>('a')

  const Tpl = useStore<any>({
    Component:"no component",
    importUrl: "no component",
  });

  useTask$(({track}) => {
    const key = track(tpl) + "-tpl"

    const loader = views[key]
    if (!loader) {
      return console.error(`No view named "${key}" found`)
    }
    const promise = loader()
    // console.log({ promise })

    promise.then((module) => {
      console.log(module)
      Tpl.Component = module.default;
      // Tpl.Component = module.default;
    })


  })
  // const Tpl = views[tpl.value + '-tpl'] as any

  return (
    <div>
      {/*<ATpl/>*/}
      <button onClick$={() => (tpl.value = tpl.value === 'a' ? 'b' : 'a')}>change tpl</button>
      <Tpl.Component />
      {/*<pre>{JSON.stringify(sData, null, 2)}</pre>*/}
    </div>
  )
})

export function resolveNavigation(url: string) {
  fetch()
}

type RouterStore = {}

const RouterContext = createContextId('RouterContext')
export function useRouterProvider(serverData: ServerData) {
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
