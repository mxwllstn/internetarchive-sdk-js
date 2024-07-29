# Internet Archive SDK for JavaScript
[![Version](https://img.shields.io/npm/v/internetarchive-sdk-js.svg)](https://www.npmjs.org/package/internetarchive-sdk-js)

NodeJS / Typescript SDK for Internet Archive APIs

## Internet Archive APIs
https://archive.org/services/docs/api/

## Install
Use `pnpm` to install the module
```bash
pnpm install internetarchive-sdk-js
```
Or use `npm` to install the module
```bash
npm install internetarchive-sdk-js
```
Or use `yarn` to install the module
```bash
yarn add internetarchive-sdk-js
```

## Library Documentation
https://mxwllstn.github.io/internetarchive-sdk-js/classes/InternetArchive.html

## Usage
### Get Items
```javascript
import InternetArchive from 'internetarchive-sdk-js'
const ia = new InternetArchive()

void (async () => {
  const filters = {
    collection: 'library_of_congress',
    subject: 'basketball'
  }
  const options = {
    rows: 10,
    fields: 'identifier'
  }
  const items = await ia.getItems({ filters, options })
  console.log(items.response.docs)
})()
```
  
### Update Item (Requires ["S3-Like API Key"](https://archive.org/account/s3.php))
```javascript
import InternetArchive from 'internetarchive-sdk-js'
const { API_KEY } = process.env || {}
const ia = new InternetArchive(API_KEY, { testmode: true })

void (async () => {
  const itemId = 'internetarchive-test-item-id'
  try {
    const response = await ia.updateItem(itemId, { title: 'new title' })
    console.log(response)
  } catch (err) {
    console.log(err.message)
  }
})()
```
