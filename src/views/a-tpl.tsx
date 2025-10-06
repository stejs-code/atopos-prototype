import { component$ } from '@qwik.dev/core'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'
import { useLoader } from '../../atopos/client/utils'

export default component$(() => {
  const location = useLoader(QwikLocationLoader)
  return (
    <div title={'a-tpl'}>
      <button class="btn btn-primary bg-red-700 text-blue-600 tex shadow-amber-300">One</button>
      <div style={{ background: 'red' }}>
        <b>this is A view</b>
        <pre>{JSON.stringify(location)}</pre>
      </div>
    </div>
  )
})
