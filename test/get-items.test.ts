import { expect, test } from 'vitest'
import InternetArchive from '../dist/index.js'
const ia = new InternetArchive()

test('get items by collection and subject', async () => {
  const filters = {
    collection: 'library_of_congress',
    subject: 'basketball',
  }
  const options = {
    rows: 10,
    fields: 'identifier',
  }
  const { response } = await ia.getItems({ filters, options }) as any ?? {}

  expect(response.numFound).toBeGreaterThan(1)
})

test('get items by uploader and mediatype', async () => {
  const { response } = await ia.getItems({
    filters: { uploader: 'brewster', mediatype: 'audio' },
    options: { rows: 5, fields: 'identifier' },
  }) as any ?? {}

  expect(response.numFound).toBeGreaterThan(0)
})
