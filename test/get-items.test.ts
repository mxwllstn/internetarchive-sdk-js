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

test('get items with page pagination returns different results per page', async () => {
  const filters = { collection: 'library_of_congress' }
  const options = { rows: 5, fields: 'identifier' }

  const { response: page1 } = await ia.getItems({ filters, options: { ...options, page: 1 } }) as any ?? {}
  const { response: page2 } = await ia.getItems({ filters, options: { ...options, page: 2 } }) as any ?? {}

  const ids1 = (page1.docs as any[]).map((d: any) => d.identifier)
  const ids2 = (page2.docs as any[]).map((d: any) => d.identifier)

  expect(ids1).toHaveLength(5)
  expect(ids2).toHaveLength(5)
  expect(ids1).not.toEqual(ids2)
})
