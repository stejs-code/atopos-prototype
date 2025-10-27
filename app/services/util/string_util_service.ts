import { camelCase, deburr, kebabCase, snakeCase, upperFirst } from 'lodash-es'
import app from '@adonisjs/core/services/app'

export class StringUtilService {
  public webalize(str: string) {
    return kebabCase(deburr(str))
  }

  className(str: string) {
    return upperFirst(camelCase(str))
  }

  fileName(str: string) {
    return snakeCase(deburr(str))
  }
}

export const strUtils = await app.container.make(StringUtilService)
