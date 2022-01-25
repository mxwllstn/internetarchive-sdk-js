import express, { Router, Request, Response } from 'express'
import InternetArchive, { Mediatype } from 'internetarchive-sdk-js'
import multer from 'multer'
import fs from 'node:fs/promises'
import { tmpdir } from 'os'

const { IA_TOKEN } = process.env || {}
const ia = new InternetArchive(<string>IA_TOKEN, { testmode: true })
const { uploadFiles, createItem, getItems, updateItem, getItem } = ia

const router = <Router>express.Router()

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

export type ApiResponse = {
  status: number
  data: Record<string, unknown>
}

const handleResponse = (res: Response, response: ApiResponse) => {
  const { status, data } = response
  res.status(status || 200).send(data)
}
const handleError = (res: Response, error: any) => {
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

router.post(
  '/item/:mediatype?',
  upload.fields([{ name: 'upload', maxCount: 1 }]),
  async (req: Request & { body: any }, res: Response): Promise<void> => {
    try {
      /* check for uploaded file */
      if (req.files && Object.keys(req.files).length > 0) {
        const { upload: upload } = req.files as {
          [fieldname: string]: Express.Multer.File[]
        }
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
        const item = await createItem(metadata, <Mediatype>mediatype || 'data')
        const id = item.id as string

        /* upload files to document bucket */
        const files = [...upload]
        if (files && files.length) {
          await uploadFiles(files, id)
        }

        /* fetch item and return as response */
        const data = await getItem(id)
        data.id = id
        data.uploads = files as any

        handleResponse(res, { status: 201, data })
      } else {
        throw new Error('no files attached')
      }
    } catch (error: any) {
      handleError(res, error)
    }
  }
)

router.put('/item/:id', async (req: Request & { body: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const metadata =
      Object.keys(req.body).length === 0
        ? {
            title: 'test title'
          }
        : req.body

    handleResponse(res, { status: 200, data: await updateItem(id, metadata) })
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await getItem(id) })
  } catch (error: any) {
    handleError(res, error)
  }
})

export default router
