import { Presenter } from '../../presenter-plugin/presenter.js'
import QwikLocationLoader from '#classes/qwik/loaders/qwik_location_loader'

export default class UserPresenter extends Presenter {
  public async actionDetail(id: string) {
    this.tpl.setFile('a-tpl.tsx')
    await this.tpl.addLoader(QwikLocationLoader, '', false)
    // return id
  }
}
