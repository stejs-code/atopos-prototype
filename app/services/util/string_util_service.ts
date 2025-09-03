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

  // Ultra-fast parameter name extractor (runtime, no deps).
  // Returns only identifier names (destructured params are skipped).
  public getParamNames(fn: Function): string[] {
    const src = Function.prototype.toString.call(fn).trim()

    // 1) carve out the parameter header
    let head = src
    const arrow = src.indexOf('=>')
    if (arrow !== -1) {
      head = src.slice(0, arrow).trim()
      if (head.startsWith('async ')) head = head.slice(6).trim()
      if (head.startsWith('(') && head.endsWith(')')) {
        head = head.slice(1, -1)
      } else {
        // concise single-param arrow: x => ...
        const m = head.match(/^([A-Za-z_$][\w$]*)$/)
        return m ? [m[1]] : []
      }
    } else {
      // function/method/constructor
      let i = head.indexOf('(')
      if (i === -1) return []
      const end = this.findMatchingParen(head, i)
      if (end === -1) return []
      head = head.slice(i + 1, end)
    }

    if (!head) return []

    // 2) split top-level params by commas (skip strings/templates/comments/regex/nesting)
    const rawParams = this.splitTopLevelByComma(head)
    if (rawParams.length === 0) return []

    // 3) extract names: identifier | ...identifier | identifier=default
    const out: string[] = []
    for (let p of rawParams) {
      p = p.trim()
      if (!p) continue

      // strip rest
      if (p.startsWith('...')) p = p.slice(3).trim()

      // take left of '=' if any
      const eq = this.indexOfTopLevelEquals(p)
      const lhs = (eq === -1 ? p : p.slice(0, eq)).trim()

      // simple identifier?
      const m = lhs.match(/^([A-Za-z_$][\w$]*)$/)
      if (m) {
        out.push(m[1])
        continue
      }

      // destructured or other pattern -> skip (no "name")
      // If you prefer to mark them, replace with: out.push(lhs);
    }
    return out
  }

  /* ----------------- helpers ----------------- */

  // Finds the index of the ')' that matches the '(' at `start`.
  private findMatchingParen(s: string, start: number): number {
    let paren = 0,
      brace = 0,
      bracket = 0
    let inS = 0 // 1:'  2:"  3:`
    let inLine = false,
      inBlock = false,
      inRegex = false,
      inRegexClass = false
    for (let i = start; i < s.length; i++) {
      const c = s.charCodeAt(i)

      // comments
      if (inLine) {
        if (c === 10 || c === 13) inLine = false
        continue
      }
      if (inBlock) {
        if (c === 42 && s.charCodeAt(i + 1) === 47) {
          i++
          inBlock = false
        }
        continue
      }

      // strings / template
      if (inS === 1) {
        if (c === 39 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 2) {
        if (c === 34 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 3) {
        if (c === 96 && s.charCodeAt(i - 1) !== 92) {
          inS = 0
          continue
        }
        if (c === 36 && s.charCodeAt(i + 1) === 123) {
          brace++
          i++
          continue
        }
        // template braces counted via brace counters below
      }

      if (inRegex) {
        if (inRegexClass) {
          if (c === 93 && s.charCodeAt(i - 1) !== 92) inRegexClass = false // ]
        } else {
          if (c === 91)
            inRegexClass = true // [
          else if (c === 47 && s.charCodeAt(i - 1) !== 92) inRegex = false // /
        }
        continue
      }

      // start comments?
      if (c === 47) {
        // '/'
        const n = s.charCodeAt(i + 1)
        if (n === 47) {
          inLine = true
          i++
          continue
        } // //
        if (n === 42) {
          inBlock = true
          i++
          continue
        } // /*
        // heuristic: start of regex if previous non-space token allows it
        if (this.isRegexStart(s, i)) {
          inRegex = true
          continue
        }
      }

      // start strings?
      if (c === 39) {
        inS = 1
        continue
      } // '
      if (c === 34) {
        inS = 2
        continue
      } // "
      if (c === 96) {
        inS = 3
        continue
      } // `

      // nesting
      if (c === 40) {
        paren++
        continue
      } // (
      if (c === 41) {
        // )
        paren--
        if (paren === 0 && brace === 0 && bracket === 0) return i
        continue
      }
      if (c === 123) {
        brace++
        continue
      } // {
      if (c === 125) {
        brace--
        continue
      } // }
      if (c === 91) {
        bracket++
        continue
      } // [
      if (c === 93) {
        bracket--
        continue
      } // ]
    }
    return -1
  }

  // Split by top-level commas.
  private splitTopLevelByComma(s: string): string[] {
    const parts: string[] = []
    let start = 0
    let paren = 0,
      brace = 0,
      bracket = 0
    let inS = 0,
      inLine = false,
      inBlock = false,
      inRegex = false,
      inRegexClass = false

    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)

      if (inLine) {
        if (c === 10 || c === 13) inLine = false
        continue
      }
      if (inBlock) {
        if (c === 42 && s.charCodeAt(i + 1) === 47) {
          i++
          inBlock = false
        }
        continue
      }

      if (inS === 1) {
        if (c === 39 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 2) {
        if (c === 34 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 3) {
        if (c === 96 && s.charCodeAt(i - 1) !== 92) {
          inS = 0
          continue
        }
        if (c === 36 && s.charCodeAt(i + 1) === 123) {
          brace++
          i++
          continue
        }
      }

      if (inRegex) {
        if (inRegexClass) {
          if (c === 93 && s.charCodeAt(i - 1) !== 92) inRegexClass = false
        } else {
          if (c === 91) inRegexClass = true
          else if (c === 47 && s.charCodeAt(i - 1) !== 92) inRegex = false
        }
        continue
      }

      if (c === 47) {
        const n = s.charCodeAt(i + 1)
        if (n === 47) {
          inLine = true
          i++
          continue
        }
        if (n === 42) {
          inBlock = true
          i++
          continue
        }
        if (this.isRegexStart(s, i)) {
          inRegex = true
          continue
        }
      }

      if (c === 39) {
        inS = 1
        continue
      }
      if (c === 34) {
        inS = 2
        continue
      }
      if (c === 96) {
        inS = 3
        continue
      }

      if (c === 40) {
        paren++
        continue
      }
      if (c === 41) {
        paren--
        continue
      }
      if (c === 123) {
        brace++
        continue
      }
      if (c === 125) {
        brace--
        continue
      }
      if (c === 91) {
        bracket++
        continue
      }
      if (c === 93) {
        bracket--
        continue
      }

      // top-level comma
      if (
        c === 44 &&
        paren === 0 &&
        brace === 0 &&
        bracket === 0 &&
        !inS &&
        !inRegex &&
        !inLine &&
        !inBlock
      ) {
        parts.push(s.slice(start, i))
        start = i + 1
      }
    }
    parts.push(s.slice(start))
    return parts
  }

  // Index of first '=' not nested (same rules as comma).
  private indexOfTopLevelEquals(s: string): number {
    let paren = 0,
      brace = 0,
      bracket = 0
    let inS = 0,
      inLine = false,
      inBlock = false,
      inRegex = false,
      inRegexClass = false

    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)

      if (inLine) {
        if (c === 10 || c === 13) inLine = false
        continue
      }
      if (inBlock) {
        if (c === 42 && s.charCodeAt(i + 1) === 47) {
          i++
          inBlock = false
        }
        continue
      }

      if (inS === 1) {
        if (c === 39 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 2) {
        if (c === 34 && s.charCodeAt(i - 1) !== 92) inS = 0
        continue
      }
      if (inS === 3) {
        if (c === 96 && s.charCodeAt(i - 1) !== 92) {
          inS = 0
          continue
        }
        if (c === 36 && s.charCodeAt(i + 1) === 123) {
          brace++
          i++
          continue
        }
      }

      if (inRegex) {
        if (inRegexClass) {
          if (c === 93 && s.charCodeAt(i - 1) !== 92) inRegexClass = false
        } else {
          if (c === 91) inRegexClass = true
          else if (c === 47 && s.charCodeAt(i - 1) !== 92) inRegex = false
        }
        continue
      }

      if (c === 47) {
        const n = s.charCodeAt(i + 1)
        if (n === 47) {
          inLine = true
          i++
          continue
        }
        if (n === 42) {
          inBlock = true
          i++
          continue
        }
        if (this.isRegexStart(s, i)) {
          inRegex = true
          continue
        }
      }

      if (c === 39) {
        inS = 1
        continue
      }
      if (c === 34) {
        inS = 2
        continue
      }
      if (c === 96) {
        inS = 3
        continue
      }

      if (c === 40) {
        paren++
        continue
      }
      if (c === 41) {
        paren--
        continue
      }
      if (c === 123) {
        brace++
        continue
      }
      if (c === 125) {
        brace--
        continue
      }
      if (c === 91) {
        bracket++
        continue
      }
      if (c === 93) {
        bracket--
        continue
      }

      if (
        c === 61 &&
        paren === 0 &&
        brace === 0 &&
        bracket === 0 &&
        !inS &&
        !inRegex &&
        !inLine &&
        !inBlock
      ) {
        return i
      }
    }
    return -1
  }

  // Heuristic: Is '/' at i the start of a regex literal?
  private isRegexStart(s: string, i: number): boolean {
    // look back for the previous non-space/tab/newline char
    let j = i - 1
    while (j >= 0) {
      const ch = s.charCodeAt(j)
      if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
        j--
        continue
      }
      break
    }
    if (j < 0) return true
    const prev = s[j]

    // After these tokens, a regex can validly start.
    // This covers most default-value contexts (after '=' or '(' or ',').
    return /[([{:;,=!?&|+\-~*%^<>]/.test(prev)
  }
}

export const strUtils = await app.container.make(StringUtilService)
