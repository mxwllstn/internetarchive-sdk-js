import express from 'express'
import InternetArchive from 'internetarchive-sdk-js'
import multer from 'multer'
import fs from 'node:fs/promises'
import { tmpdir } from 'os'

const { IA_TOKEN } = process.env || {}
const ia = new InternetArchive(IA_TOKEN, { testmode: true })
const { uploadFiles, createItem, getItems, updateItem, getItem } = ia

const router = express.Router()

const storage = multer.diskStorage({
  async destination(_req, _file, cb) {
    const tempDir = await fs.mkdtemp(`${tmpdir}/uploads-`)
    cb(null, tempDir)
  },
  filename(_req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage })

const handleResponse = (res, response) => {
  const { status, data } = response
  res.status(status || 200).send(data)
}
const handleError = (res, error) => {
  if (error.response) {
    const { status, data } = error.response
    res.status(status).send({ data })
  } else {
    const { message } = error
    // eslint-disable-next-line no-console
    console.log(message)
    res.status(400).send({ error: message })
  }
}

router.post('/item/:mediatype?', upload.fields([{ name: 'upload', maxCount: 1 }]), async (req, res) => {
  try {
    /* check for uploaded file */
    if (req.files && Object.keys(req.files).length > 0) {
      const { upload: upload } = req.files
      if (!upload) {
        throw new Error('no file attached')
      }

      /* create item with requested metadata */
      const { mediatype } = req.params || {}
      const body = req.body
      const { collection, subject, description } = body || {}
      const metadata = {
        ...body,
        collection: collection || 'opensource_image',
        ...(subject && { subject }),
        ...(description && { description })
      }
      const item = await createItem(metadata, mediatype || 'data')
      const id = item.id

      /* upload files to document bucket */
      const files = [...upload]
      if (files && files.length) {
        await uploadFiles(files, id)
      }

      /* fetch item and return as response */
      const data = await getItem(id)
      data.id = id
      data.uploads = files

      handleResponse(res, { status: 201, data })
    } else {
      throw new Error('no files attached')
    }
  } catch (error) {
    handleError(res, error)
  }
})

router.put('/item/:id', async (req, res) => {
  try {
    const { id } = req.params
    const metadata =
      Object.keys(req.body).length === 0
        ? {
            title: 'test title'
          }
        : req.body

    handleResponse(res, { status: 200, data: await updateItem(id, metadata) })
  } catch (error) {
    handleError(res, error)
  }
})

router.get('/item', async (req, res) => {
  try {
    const payload =
      Object.keys(req.body).length === 0
        ? {
            filters: {
              collection: 'library_of_congress'
            },
            options: {
              rows: 100,
              fields: 'identifier'
            }
          }
        : req.body
    const { filters, options } = payload || {}

    handleResponse(res, { status: 200, data: await getItems(filters, options) })
  } catch (error) {
    handleError(res, error)
  }
})

router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await getItem(id) })
  } catch (error) {
    handleError(res, error)
  }
})

export default router
