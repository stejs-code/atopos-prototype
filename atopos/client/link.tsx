import { $, component$, PropsOf, Slot, sync$ } from '@qwik.dev/core'
import { useNavigate } from './use-navigate'

export type LinkProps = PropsOf<'a'> & {}
export const Link = component$<LinkProps>((props) => {
  const { ...rest } = props
  const navigate = useNavigate()

  const onClickLazy$ = $(async (e: MouseEvent) => {
    if (e.defaultPrevented) {
      await navigate(rest.href!)
    }
  })

  const preventForSpaClick$ = sync$(async (e: MouseEvent) => {
    // Only intercept primary button without modifiers (SPA nav case)
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault()
    }
  })

  return (
    <a
      {...rest}
      onMouseEnter$={async () => {
        await navigate(rest.href!, { justPrefetch: true })
      }}
      onClick$={[preventForSpaClick$, onClickLazy$]}
    >
      <Slot />
    </a>
  )
})
