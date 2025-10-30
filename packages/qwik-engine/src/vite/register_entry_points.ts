import type { Plugin, UserConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { resolve, join, extname, basename } from 'node:path'
import type { InputOption } from 'rollup'

type Opts = {
  dirs: string[] // directory to scan
  exts?: string[] // which files become SSR entries
  preserveModules?: boolean // true = absolutely no bundling (1:1 files)
  preserveModulesRoot?: string
  entryFileNames?: string // customize SSR entry filenames
}

// TODO: add dir watcher for new files, or maybe not?
export function registerEntryPoints(opts: Opts): Plugin {
  const {
    dirs,
    exts = ['.ts', '.js', '.mjs', '.tsx'],
    preserveModules = false,
    preserveModulesRoot,
    entryFileNames = '[name].js',
  } = opts

  return {
    name: 'vite-adonis-entry-points',
    enforce: 'pre',

    config(user, { command }): UserConfig | void {
      const input: Record<string, string> = {}

      for (const dir of dirs) {
        const abs = resolve(process.cwd(), dir)
        const files = readdirSync(abs, { withFileTypes: true })
          .filter((d) => d.isFile())
          .map((d) => d.name)
          .filter((n) => exts.includes(extname(n)))

        for (const file of files) {
          input[join(dir, basename(file, extname(file)))] = join(abs, file)
        }
      }

      const finalInput = mergeRollupInputs(user.build?.rollupOptions?.input, input)
      finalInput['src/entry.ssr'] = 'src/entry.ssr.tsx'

      const naming =
        command === 'build'
          ? {
              chunkFileNames: '[hash].js',
              assetFileNames: '[hash][extname]',
            }
          : {
              chunkFileNames: 'chunks/[name]-[hash].js',
              assetFileNames: 'assets/[name]-[hash][extname]',
            }

      return {
        build: {
          manifest: true,
          rollupOptions: {
            input: finalInput,
            output: {
              entryFileNames,
              ...naming,
              ...(preserveModules
                ? {
                    preserveModules: true,
                    ...(preserveModulesRoot ? { preserveModulesRoot } : {}),
                  }
                : {}),
            },
            // (SSR niceties)
            // avoid accidental single-bundle via inline dynamic imports
            // inlineDynamicImports: false,
            // make sure entry points stay as entries
            preserveEntrySignatures: 'strict',
          },
        },
      }
    },
  }
}

/**
 * Merge user-provided rollupOptions.input with additional entries.
 *
 * @param userInput - user.build?.rollupOptions.input (can be string | string[] | object)
 * @param newInput - object mapping entryName -> absolute path
 * @returns merged object suitable for rollupOptions.input
 */
export function mergeRollupInputs(
  userInput: InputOption | undefined,
  newInput: Record<string, string>
): Record<string, string> {
  // normalize user input to object
  let normalized: Record<string, string> = {}

  if (!userInput) {
    normalized = {}
  } else if (typeof userInput === 'string') {
    // single entry string -> give it a generic name
    normalized = { main: resolve(userInput) }
  } else if (Array.isArray(userInput)) {
    // array -> index-based names
    normalized = Object.fromEntries(userInput.map((file, idx) => [`entry${idx}`, resolve(file)]))
  } else {
    // already an object
    normalized = Object.fromEntries(Object.entries(userInput).map(([k, v]) => [k, resolve(v)]))
  }

  // merge (new input overrides existing on same name)
  return { ...normalized, ...newInput }
}
