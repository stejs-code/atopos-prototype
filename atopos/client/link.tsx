import {
  $,
  component$,
  PropsOf,
  Slot,
  sync$,
  useComputed$,
  useServerData,
  useSignal,
} from '@qwik.dev/core'
import { useNavigate } from './use-navigate'
import type { HttpRouterService } from '@adonisjs/core/types'

export type LinkProps = PropsOf<'a'> & {
  'n:href'?: string
  'n:params'?: Record<string, any>
}
export const Link = component$<LinkProps>((props) => {
  const { 'n:params': nParams, 'n:href': nHref, 'href': naturalHref, ...rest } = props
  const navigate = useNavigate()
  const parsedHref = useResolvedUrl(nHref, nParams)
  const href = useComputed$(() => {
    return naturalHref ?? parsedHref.value
  })

  const onClickLazy$ = $(async (e: MouseEvent) => {
    if (e.defaultPrevented && href.value) {
      await navigate(href.value)
    }
  })

  const preventForSpaClick$ = sync$(async (e: MouseEvent) => {
    // Only intercept primary button without modifiers (SPA nav case)
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault()
    }
  })

  return (
    <a
      {...rest}
      // preventdefault:click // TODO: remove when sync works again
      onMouseEnter$={async () => {
        if (href.value) {
          await navigate(href.value, { justPrefetch: true })
        }
      }}
      onClick$={[preventForSpaClick$, onClickLazy$]}
      href={href.value}
    >
      <Slot />
    </a>
  )
})

export function useResolvedUrl(magic?: string, params?: Record<string, any>) {
  const serverRouter = useServerData<HttpRouterService>('router')
  const serverResolved = magic
    ? serverRouter?.builder().params(params).qs(params).make(magic)
    : undefined

  const hrefSig = useSignal(serverResolved)

  return hrefSig
}
