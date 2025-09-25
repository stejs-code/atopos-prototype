import { inject } from '@adonisjs/core'
import { QwikTemplate } from '#classes/qwik/qwik_template'

@inject()
export class Presenter {
  constructor(protected tpl: QwikTemplate) {
    this.startup()
  }

  public startup() {

  }

  getTemplate() {
    if (this.tpl.templateFile) {
      return this.tpl
    }
  }
}
