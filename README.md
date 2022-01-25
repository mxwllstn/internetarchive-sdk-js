# Internet Archive SDK for JavaScript
NodeJS / Typescript SDK for Internet Archive APIs

## Internet Archive APIs
https://archive.org/services/docs/api/

## Install
Use `npm` to install the module
```bash
npm install internetarchive-sdk-js
```
Or use `yarn` to install the module
```bash
yarn add internetarchive-sdk-js
```

## Usage
```javascript
import InternetArchive from 'internetarchive-sdk-js'
const ia = new InternetArchive(process.env.IA_TOKEN, { testmode: true })

;(async () => {
  const filters = {
    collection: 'library_of_congress',
    subject: 'basketball'
  }
  const options = {
    rows: 10,
    fields: 'identifier'
  }
  const items = await ia.getItems(filters, options)
  console.log(items.response.docs)
})()
```
