import express, { Router, Request, Response } from 'express'
import InternetArchive, { Mediatype } from 'internetarchive-sdk-js'
import multer from 'multer'
import fs from 'node:fs/promises'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'

const { IA_TOKEN } = process.env || {}
const ia = new InternetArchive((IA_TOKEN as string), { testmode: true, setScanner: true })

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
  data: Record<string, any>
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
        const { upload: uploads } = req.files as Record<string, Express.Multer.File[]>
        const upload = uploads[0]
        if (!upload) {
          throw new Error('no file attached')
        }

        /* create item with requested metadata */
        const mediatype = req.params.mediatype as Mediatype
        const body = req.body
        const { subject, description } = body || {}
        const collection = body?.collection || 'opensource_image'
        const metadata = {
          ...body,
          ...(subject && { subject }),
          ...(description && { description }),
        }
        const uuid = randomBytes(8).toString('hex').toLowerCase()
        const identifier = 'test' + uuid
        const item = await ia.createItem({ identifier, collection, mediatype, upload, metadata })

        /* fetch item and return as response */
        const data = item

        handleResponse(res, { status: 201, data })
      } else {
        throw new Error('no files attached')
      }
    } catch (err: any) {
      handleError(res, err)
    }
  },
)

router.put('/item/:identifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params
    const metadata = Object.keys(req.body).length === 0
      ? {
          title: 'test title',
        }
      : req.body

    handleResponse(res, { status: 200, data: await ia.updateItem(identifier, metadata) })
  } catch (err: any) {
    handleError(res, err)
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

    handleResponse(res, { status: 200, data: await ia.getItems({ filters, options }) })
  } catch (err: any) {
    handleError(res, err)
  }
})

router.get('/item/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await ia.getItem(id) })
  } catch (err: any) {
    handleError(res, err)
  }
})

router.get('/item/:id/task', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    handleResponse(res, { status: 200, data: await ia.getItemTasks(id) })
  } catch (err: any) {
    handleError(res, err)
  }
})

export default router
