import { readPackageJSON } from 'pkg-types'
import { randomBytes } from 'crypto'
import slugify from 'slugify'
import { z, type RefinementCtx } from 'zod'

export async function getPackageInfo() {
  try {
    return await readPackageJSON('./node_modules/internetarchive-sdk-js/package.json')
  } catch {
    return null
  }
}

export function generateItemIdFromMetadata(metadata: Record<string, string>) {
  const uuid = randomBytes(8).toString('hex').toLowerCase()

  const title
    = metadata?.title && metadata?.subject
      ? `${metadata?.subject}-${metadata?.title}-${uuid}`
      : metadata?.collection
        ? `${metadata?.collection}-${uuid}`
        : uuid

  return slugify(title, {
    replacement: '-',
    lower: true,
    strict: true,
    trim: true,
  })
}

export function isASCII(str: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]+$/.test(str)
}

export function parseZodErrorToString(err: z.ZodError) {
  return err.issues.map((issue, _idx) => {
    const path = issue.path?.[0] ? `${issue.path?.[0]} - ` : ''
    return path + `${issue.message}`
  }).join(', ')
}

/* https://github.com/colinhacks/zod/issues/61 */
export function oneOf<A, K1 extends Extract<keyof A, string>, K2 extends Extract<keyof A, string>, R extends A &(
  Required<Pick<A, K1>> & { [P in K2]: undefined } |
  Required<Pick<A, K2>> & { [P in K1]: undefined }
)>(key1: K1, key2: K2): ((arg: A, ctx: RefinementCtx) => arg is R) {
  return (arg, ctx): arg is R => {
    if ((arg[key1] === undefined) === (arg[key2] === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Either <${key1}> or <${key2}> must be set.`,
      })
      return false
    }
    return true
  }
}
