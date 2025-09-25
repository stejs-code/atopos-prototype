import { component$ } from '@qwik.dev/core'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'
import { useLoader } from '~/app/utils'

export default component$(() => {
  const location = useLoader(QwikLocationLoader)
  return (
    <div title={'a-tpl'}>
      <div style={{ background: 'red' }}>
        <b>this is A view</b>
        <pre>{JSON.stringify(location)}</pre>
      </div>
    </div>
  )
})

