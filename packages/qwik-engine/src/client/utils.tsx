import { QwikLoader } from '../vite/loaders-plugin/qwik_loader'
import { QRL, useContext } from '@builder.io/qwik'
import { routerContext } from './router'

export function useLoader<T extends typeof QwikLoader>(
  loaderClass: T | string
): Readonly<Awaited<InstanceType<T>['data']>> {
  const loaderName = typeof loaderClass === 'string' ? loaderClass : loaderClass.name
  const router = useContext(routerContext)

  return router.loaders[loaderName]
}

/**
 * CRITICAL, WATCH FOR CHANGES IN CORE
 * @param c
 */
export function getComponentQrl(c: unknown): QRL | undefined {
  const symbol = Object.getOwnPropertySymbols(c).find((i) => i.description == 'serializable-data')
  if (symbol) {
    return (c as any)?.[symbol]?.[0]
  }
}
