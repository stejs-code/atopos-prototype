import { component$, createContextId, useServerData, useSignal, useStore } from '@qwik.dev/core'
import { AdoQwik } from '#services/qwik'
import ATpl from './a-tpl.js'
import BTpl from './b-tpl.js'

const tplRegistry = {
  a: ATpl,
  b: BTpl,
}

export const Router = component$(() => {
  const sData = useServerData<AdoQwik.RenderData>('location')
  console.log(sData)
  const tpl = useSignal<keyof typeof tplRegistry>('a')
  const Tpl = tplRegistry[tpl.value] as any

  return (
    <div>
      <button onClick$={() => (tpl.value = tpl.value === 'a' ? 'b' : 'a')}>change tpl</button>
      <Tpl/>
      <pre>{JSON.stringify(sData, null, 2)}</pre>
    </div>
  )
})

type RouterStore = {}

const RouterContext = createContextId('RouterContext')
export function useRouterProvider(serverData: ServerData) {
  const store = useStore({})
}
