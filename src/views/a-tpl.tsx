import { component$, useSignal } from '@builder.io/qwik'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'
import { useLoader } from 'atopos/client/utils'
import { Form } from 'atopos/client/form'

export default component$(() => {
  const location = useLoader(QwikLocationLoader)
  const count = useSignal(4)
  return (
    <div title={'a-tpl'}>
      <Form>

      </Form>
      <button class="btn btn-primary text-center bg-red-700 text-blue-600 tex text shadow-amber-300" onClick$={() => count.value+=2}>One {count.value}</button>
      <div style={{ background: 'red' }}>
        <b>this is A view</b>
        <pre>{JSON.stringify(location)}</pre>
      </div>
    </div>
  )
})
