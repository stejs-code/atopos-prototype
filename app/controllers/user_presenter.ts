import { Presenter } from '../../atopos/server/presenter.js'

export default class UserPresenter extends Presenter {
  startup() {
    super.startup()

    this.tpl.setLayout("app")
  }

  public async actionDetail(id: string) {
    console.log('detail', id)
    this.tpl.setFile('a-tpl')

    // return id
  }

  public async actionEdit(id: string) {
    console.log('edit', id)
    this.tpl.setFile('b-tpl')
  }
}
