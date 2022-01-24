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
import InternetArchive from 'internetarchive-api-wrapper'
const ia = new InternetArchive(process.env.IA_TOKEN, { testmode: true })

(async () => {
  const filters = {
    ...(collection && { collection }),
    ...(subject && { subject }),
    ...(creator && { creator })
  }
  const items = await ia.getItems(filters)
  console.log(items)
})()
```
