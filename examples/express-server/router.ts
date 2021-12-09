import express, { Router, Request, Response } from 'express'
import InternetArchive, { Mediatype } from '../..'
import multer from 'multer'

const { IA_TOKEN, IA_COLLECTION, IA_SUBJECT, IA_CREATOR } = process.env || {}
const ia = new InternetArchive(<string>IA_TOKEN, { testmode: true })
const { createItem, getItems, updateItem, getItem } = ia

const router = <Router>express.Router()

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, 'tmp/uploads')
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
  res.status(status).send(data)
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
  '/item/:mediatype',
  upload.fields([
    { name: 'audioUpload', maxCount: 1 },
    { name: 'imageUpload', maxCount: 1 }
  ]),
  async (
    req: Request & { body: any }, // to do: set up a itemFields type
    res: Response
  ): Promise<void> => {
    try {
      /* create item with requested metadata */
      const metadata = {
        ...req.body,
        ...(IA_COLLECTION && { collection: <string>IA_COLLECTION }),
        ...(IA_SUBJECT && { subject: <string>IA_SUBJECT }),
        ...(IA_CREATOR && { creator: <string>IA_CREATOR })  
      }
      
      const { mediatype } = req.params
      const response = await createItem(metadata, <Mediatype>mediatype || 'data')
      handleResponse(res, response)
    } catch (error: any) {
      handleError(res, error)
    }
  }
)

router.put('/item/:id', async (req: Request & { body: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const metadata = req.body
    handleResponse(res, await updateItem(id, metadata))
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item', async (_req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      ...(IA_COLLECTION && { collection: <string>IA_COLLECTION }),
      ...(IA_SUBJECT && { subject: <string>IA_SUBJECT }),
      ...(IA_CREATOR && { creator: <string>IA_CREATOR })
    }
    handleResponse(res, await getItems(filters))
  } catch (error: any) {
    handleError(res, error)
  }
})

router.get('/item/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    handleResponse(res, await getItem(id))
  } catch (error: any) {
    handleError(res, error)
  }
})

export default router
