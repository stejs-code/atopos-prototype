import { component$ } from '@qwik.dev/core'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'
import { useLoader } from '../../atopos/client/utils'

export default component$(() => {
  const location = useLoader(QwikLocationLoader)
  return (
    <div title={'a-tpl'}>
      <button class="btn">One</button>

      <div style={{ background: 'red' }}>
        <b>this is A view</b>
        <pre>{JSON.stringify(location)}</pre>
      </div>
    </div>
  )
})

