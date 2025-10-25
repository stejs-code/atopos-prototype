import { component$ } from '@qwik.dev/core'
import { useHead } from '../../atopos/client/router.js'
import css from '../index.css?url'

export const RouterHead = component$(() => {
  const head = useHead()

  return (
    <>
      <meta charset="utf-8" />
      <title>{head.title}</title>
      <link href={css} rel="stylesheet" />

      {head.elements.map((el, i) => {
        const { props } = el as any

        switch (el.type) {
          case 'link':
            return <link key={i} {...props} />

          case 'meta':
            return <meta key={i} {...props} />

          case 'script': {
            // supports inline content via { children: string } or external via { src: string }
            if (typeof props?.children === 'string') {
              const { children, ...rest } = props
              return <script key={i} {...rest} dangerouslySetInnerHTML={children} />
            }
            return <script key={i} {...props} />
          }

          default:
            return null
        }
      })}
    </>
  )
})
