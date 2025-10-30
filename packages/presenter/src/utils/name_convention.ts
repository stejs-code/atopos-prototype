import { camelCase, upperFirst } from 'lodash-es'
import { HttpContext } from '@adonisjs/core/http'
import { manifest } from '../manifest/manifest.js'
import { Presenter } from '../class/presenter.js'
import { classNameString } from './utils.js'

class NameConvention {
  protected id: string
  protected parseId(input: string): string {
    return input
  }
  protected createName(id: string) {
    return id
  }

  constructor(input: string | NameConvention) {
    if (input instanceof NameConvention) {
      this.id = input.id
    } else {
      this.id = this.parseId(input)
    }
  }

  getID() {
    return this.id
  }

  getName() {
    return this.createName(this.id)
  }

  toString() {
    return this.createName(this.id)
  }
}

/**
 * Action id is e.g. "detail" or "signIn"
 * "actionDetail" -> "detail"
 * @param input
 */
export class ActionID extends NameConvention {
  constructor(
    id: string | ActionID,
    public presenterID?: PresenterID
  ) {
    super(id)
  }

  protected parseId(input: string): string {
    input = camelCase(input)

    if (input.startsWith('action')) {
      input = input.substring('action'.length, input.length)
    }

    return input
  }

  protected createName(id: string): string {
    return `action${upperFirst(id)}`
  }

  public exists() {
    const result = this.presenterID
      ?.getMetadata()
      ?.methods.findIndex((i) => i.name === this.getName())

    if (!result || result === -1) {
      return false
    }

    return true
  }

  public getMetadata() {
    return this.presenterID?.getMetadata()?.methods.find((i) => i.name === this.getName())
  }

  public async getFunction(httpContext: HttpContext): Promise<Function | undefined> {
    const instance = await this.presenterID?.getInstance(httpContext)

    return instance[this.getName()].bind(instance)
  }
}

/**
 * Presenter id is e.g. "User" or "UserAuth"
 * "UserPresenter" -> "User"
 * Presenter id is a string that isn't the name of the class, it's the name minus the "Presenter" suffix
 * This helper converts strings like "user-group", "userGroupPresenter", "user_group_presenter" into unified id "UserGroup"
 * @param input
 */
export class PresenterID extends NameConvention {
  protected parseId(input: string): string {
    input = classNameString(input)

    if (input.endsWith('Presenter')) {
      input = input.substring(0, input.length - 'Presenter'.length)
    }

    return input
  }

  protected createName(id: string): string {
    return `${upperFirst(id)}Presenter`
  }

  public exists() {
    return manifest.presenters.has(this.id)
  }

  public get() {
    return manifest.presenters.get(this.id)
  }

  public getMetadata() {
    return this.get()?.metadata
  }

  public async getDeclaration() {
    return (await this.get()?.declaration()) as Promise<typeof Presenter | undefined>
  }

  public async getInstance(httpContext: HttpContext): Promise<any> {
    const cls = await this.getDeclaration()
    if (!cls) return undefined

    const instance = await httpContext.containerResolver.make(cls)
    httpContext.containerResolver.bindValue(cls, instance)
    return instance
  }
}
