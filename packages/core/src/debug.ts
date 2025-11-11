import app from '@adonisjs/core/services/app'
import { AtoposConfig } from './config/index.js'

let shouldLog: boolean

export default function debug(...args: any[]) {
  if (shouldLog === undefined) {
    shouldLog = app.config.get<AtoposConfig>('atopos.atopos')?.debug
  }

  if (shouldLog) {
    console.log(
      `[Atopos debug][${Math.floor(performance.now()).toString().padStart(8, '_')}ms]`,
      ...args
    )
  }
}
