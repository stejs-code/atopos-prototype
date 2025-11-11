import { camelCase, deburr, kebabCase, snakeCase, upperFirst } from 'lodash-es'

export function webalizeString(str: string) {
  return kebabCase(deburr(str))
}

export function classNameString(str: string) {
  return upperFirst(camelCase(str))
}

export function fileNameString(str: string) {
  return snakeCase(deburr(str))
}

export type MaybeArray<T> = T[] | T
