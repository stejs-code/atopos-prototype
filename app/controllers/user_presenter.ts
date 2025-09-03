import { z } from 'zod/v4';

export default class UserPresenter {
  public actionDetail(id: string = 'a', { version }?: { version: number }, x: boolean): void {
    console.log('DETAIL')
  }
}














