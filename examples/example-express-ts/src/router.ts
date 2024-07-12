import express, { Router, Request, Response } from 'express'
import InternetArchive, { Mediatype, Item } from 'internetarchive-sdk-js'
import multer from 'multer'
import fs from 'node:fs/promises'
import { tmpdir } from 'os'

const { IA_TOKEN } = process.env || {}
const ia = new InternetArchive((IA_TOKEN as string), { testmode: true })

const router = express.Router() as Router

const storage = multer.diskStorage({
  async destination(_req, _file, cb) {
    const tempDir = await fs.mkdtemp(`${tmpdir}/uploads-`)
    cb(null, tempDir)
  },
  filename(_req, file, cb) {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage })

export interface ApiResponse {
  status: number
  data: Item
}

function handleResponse(res: Response, response: ApiResponse) {
  const { status, data } = response
  res.status(status || 200).send(data)
}

function handleError(res: Response, error: any) {
  const { message } = error
  console.log(message)
  res.status(error.statusCode || 400).send({ error: message })
}

router.post(
  '/item/:mediatype?',
  upload.fields([{ name: 'upload', maxCount: 1 }]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      /* check for uploaded file */
      if (req.files && Object.keys(req.files).length > 0) {
        const { upload: upload } = req.files as Record<string, Express.Multer.File[]>
        if (!upload) {
          throw new Error('no file attached')
        }

        /* create item with requested metadata */
        const { mediatype } = req.params || {}
        const body = req.body
        console.log({ body })
        const { subject, description } = body || {}
        const collection = body?.collection || 'opensource_image'
        const metadata = {
          ...body,
          ...(subject && { subject }),
          ...(description && { description }),
        }
        const item = await ia.createItem(collection, mediatype as Mediatype || 'data', metadata)
        console.log({ item })
        const id = item.id as string

        /* upload files to document bucket */
        const files = [...upload]
        if (files?.length) {
          await ia.uploadFiles(files, id)
        }

        /* fetch item and return as response */
        const data = await ia.getItem(id)
        data.id = id
        data.uploads = files as any

        handleResponse(res, { status: 201, data })
      } else {
        throw new Error('no files attached')
      }
    } catch (error: any) {
      handleError(res, error)
    }
  },
)

router.put('/item/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const metadata = Object.keys(req.body).length === 0
      ? {
          title: 'test title',
        }
      : req.body

    handleResponse(res, { status: 200, data: await ia.updateItem(id, metadata) })
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = Object.keys(req.body).length === 0
      ? {
          filters: {
            collection: 'library_of_congress',
          },
          options: {
            rows: 100,
            fields: 'identifier',
          },
        }
      : req.body
    const { filters, options } = payload || {}

    handleResponse(res, { status: 200, data: await ia.getItems(filters, options) })
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await ia.getItem(id) })
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item/:id/task', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await ia.getItemTasks(id) })
  } catch (error: any) {
    handleError(res, error)
  }
})

export default router
