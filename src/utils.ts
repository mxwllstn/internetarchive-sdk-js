import { randomBytes } from 'crypto'
import slugify from 'slugify'

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
