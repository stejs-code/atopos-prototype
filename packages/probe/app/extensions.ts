import { Router, RouteGroup } from '@adonisjs/core/http'

declare module '@adonisjs/core/http' {
  interface Router {
    property(): boolean
  }

  interface RouteGroup {
    getPrefix(): string
  }
}

Router.macro('property', function (this: Router) {
  return false
})

RouteGroup.macro('getPrefix', function (this: RouteGroup) {
  console.log(Object.getOwnPropertyNames(this))
  console.log(this.routes)
  return ""
})
