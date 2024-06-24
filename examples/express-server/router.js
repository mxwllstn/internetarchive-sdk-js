import InternetArchive from 'internetarchive-sdk-js'
import express from 'express'
import fs from 'node:fs/promises'
import multer from 'multer'
import { tmpdir } from 'os'

const { IA_TOKEN } = process.env || {},
  ia = new InternetArchive(IA_TOKEN, { testmode: true }),
  { uploadFiles, createItem, getItems, updateItem, getItem } = ia,

  router = express.Router(),

  storage = multer.diskStorage({
    async destination(_req, _file, cb) {
      const tempDir = await fs.mkdtemp(`${tmpdir}/uploads-`)
      cb(null, tempDir)
    },
    filename(_req, file, cb) {
      cb(null, file.originalname)
    },
  }),

  upload = multer({ storage }),

  handleResponse = (res, response) => {
    const { status, data } = response
    res.status(status || 200).send(data)
  },
  handleError = (res, error) => {
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
    /* Check for uploaded file */
    if (req.files && Object.keys(req.files).length > 0) {
      const { upload } = req.files
      if (!upload) {
        throw new Error('no file attached')
      }

      /* Create item with requested metadata */
      const { mediatype } = req.params || {},
        { body } = req,
        { collection, subject, description } = body || {},
        metadata = {
          ...body,
          collection: collection || 'opensource_image',
          ...(subject && { subject }),
          ...(description && { description }),
        },
        item = await createItem(metadata, mediatype || 'data'),
        { id } = item,

        /* Upload files to document bucket */
        files = [...upload]
      if (files?.length) {
        await uploadFiles(files, id)
      }

      /* Fetch item and return as response */
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
    const { id } = req.params,
      metadata
      = Object.keys(req.body).length === 0
        ? {
            title: 'test title',
          }
        : req.body

    handleResponse(res, { status: 200, data: await updateItem(id, metadata) })
  } catch (error) {
    handleError(res, error)
  }
})

router.get('/item', async (req, res) => {
  try {
    const payload
      = Object.keys(req.body).length === 0
        ? {
            filters: {
              collection: 'library_of_congress',
            },
            options: {
              rows: 100,
              fields: 'identifier',
            },
          }
        : req.body,
      { filters, options } = payload || {}

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
