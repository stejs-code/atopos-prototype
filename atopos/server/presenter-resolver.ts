/**
 * "Home:hi" => HomePresenter.actionHi()
 */
import app from '@adonisjs/core/services/app'
import { QwikDevToolsService } from '#services/qwik/qwik_dev_tools_service.js'
import { Manifest } from 'atopos/shared/manifest/manifest.js'
import { Presenter } from './presenter.js'
import UserPresenter from '#controllers/user_presenter.js'
import { Mosaic } from './mosaic.js'

export class PresenterResolver {
  createHref(magicString: string) {

  }
}


// type Mosaic<T extends typeof Presenter, Method extends ActionKeys<T>> = [T, Method]

app.container.singleton(QwikDevToolsService, () => {
  return new QwikDevToolsService()
})
export const presenterResolver = await app.container.make(PresenterResolver)

Mosaic.make([UserPresenter, (i) => i.actionDetail, '2'])
presenterResolver.parseMosaic('User:detail id:a')
presenterResolver.parseMosaic('User:actionDetail id:a')
presenterResolver.parseMosaic('UserPresenter:actionDetail id:a')
// presenterResolver.parseMosaic([UserPresenter, (i) => i.actionEdit])
presenterResolver.parseMosaic('User:!')
