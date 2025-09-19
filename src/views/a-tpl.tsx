import { component$ } from '@qwik.dev/core'
import { useLoader, useLoadersProvider } from '~/app/router'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'

export default component$(() => {
  const location = useLoader(QwikLocationLoader)
  return (
    <div>
      <div style={{ background: 'red' }}>
        aAAx
        <pre>{JSON.stringify(location)}</pre>
      </div>
      this is AAAA compoentnt
    </div>
  )
})
