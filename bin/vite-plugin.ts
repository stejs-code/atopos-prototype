import type { Plugin } from 'vite'
import fs from 'fs'
import * as path from 'node:path'
import { camelCase, upperFirst } from 'lodash-es'

export function vitePlugin(): Plugin {
  const virtualModuleId = 'virtual:adonis-qwik-manifest'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'tm-vite-plugin',
    enforce:"pre",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        return await getTemplates()
      }
    },
  }
}
const viewsDir = "src/views"
const importPrefix = "/src/views"
async function getTemplates() {
  const fileNames = await fs.promises.readdir(viewsDir, { recursive: true })

  const files = fileNames.map((file) => {
    const parsedFile = path.parse(file)
    const tplName = path.join(parsedFile.dir, parsedFile.name)
    const importStatement = upperFirst(camelCase(tplName))

    return {
      ...parsedFile,
      tplName,
      importStatement,
    }
  })

  let jsCode = ''
  // files.forEach((file) => {
  //   jsCode += `import ${file.importStatement} from "${importPrefix}/${file.tplName}.jsx";\n`
  // })

  jsCode += `export const views = {`

  files.forEach((file) => {
    jsCode += `"${file.tplName}": () => import("${importPrefix}/${file.tplName}.jsx"),\n`
  })

  jsCode += `};`

  return jsCode
}
