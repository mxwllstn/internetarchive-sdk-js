import { expect, test } from 'vitest'
import InternetArchive from '../dist'
const ia = new InternetArchive()

test('get items', async () => {
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
