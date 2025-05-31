import InternetArchive from '@internetarchive-sdk-js'
const ia = new InternetArchive()

void (async () => {
  const filters = {
    collection: 'library_of_congress',
    subject: 'basketball',
  }
  const options = {
    rows: 10,
    fields: 'identifier',
  }
  const items = await ia.getItems({ filters, options })
  console.log(items.response.docs)
})()
