import { BasePresenter } from '#classes/base_presenter'

export default class UserPresenter extends BasePresenter {
  actionHello(id: number, name?: string) {
    console.log(id)
    return 'Hello ' + id
  }
}
