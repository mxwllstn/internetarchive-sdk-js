import { randomBytes } from 'crypto'
import slugify from 'slugify'
import { ZodError } from 'zod'

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

export function parseZodErrorToString(err: ZodError) {
  return err.issues.map((issue, idx) => `(${idx + 1})${issue.path?.[0]} - ${issue.message}`).join(', ')
}
