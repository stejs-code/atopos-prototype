import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export class Base {
  constructor(protected ctx: HttpContext) {}
}
