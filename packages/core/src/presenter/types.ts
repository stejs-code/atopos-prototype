import { Route } from './dynamic_router.js'

export type PresenterClass = abstract new (...args: any) => any
export type OpaqueParams = Record<string, any>
export type RouteHandler = {
  route: Route
  paramValidator: (params: OpaqueParams) => OpaqueParams
}
