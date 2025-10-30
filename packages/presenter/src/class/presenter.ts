import { inject } from '@adonisjs/core'
import { camelCase, upperFirst } from 'lodash-es'

@inject()
export class Presenter {
  // protected tpl: QwikTemplate
  // getTemplate() {
  //   if (this.tpl.templateFile) {
  //     return this.tpl
  //   }
  // }

  constructor() {
    this.startup()
  }

  public startup() {}

  /**
   * Presenter id is a string that isn't the name of the class, it's the name minus the "Presenter" suffix
   * This function converts strings like "user-group", "userGroupPresenter", "user_group_presenter" to unified id "UserGroup"
   * @param input
   * @deprecated
   */
  static parsePresenterId(input: string) {
    input = upperFirst(camelCase(input))

    if (input.endsWith('Presenter')) {
      input = input.substring(0, input.length - 'Presenter'.length)
    }

    return input
  }

  /**
   * Action id is e.g. "detail" or "signIn"
   * "actionDetail" -> "detail"
   * @param input
   */
  static parseActionId(input: string) {
    input = camelCase(input)

    if (input.startsWith('action')) {
      input = input.substring('action'.length, input.length)
    }

    return input
  }
}
