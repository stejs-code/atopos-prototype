import { DynamicRouter } from '@atopos/core'

export default class Router extends DynamicRouter {
  async registerRoutes(): Promise<void> {
    this.makeRoute('/cs', 'Home:default')
    this.makeRoute('/cs/<action$>', 'User:$')
    this.makeRoute('/<presenter$>/<action$>', '$:$')
    // this.makeRoute('/<lang>/<action$>', 'Home:$', { lang: 'en' }).canonical()
  }
}
