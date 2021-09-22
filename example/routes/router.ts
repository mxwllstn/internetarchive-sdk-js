import express, { Router, Request, Response } from 'express'
import InternetArchive, { Mediatype } from '../../src'
// import multer from 'multer'

const { IA_TOKEN, IA_COLLECTION, IA_CREATOR } = process.env || {}
const ia = new InternetArchive(<string>IA_TOKEN, <string>IA_COLLECTION, <string>IA_CREATOR, { testmode: true })
const { createItem, getItems } = ia

const router = <Router>express.Router()

// const storage = multer.diskStorage({
//   destination(_req, _file, cb) {
//     cb(null, 'tmp/uploads')
//   },
//   filename(_req, file, cb) {
//     cb(null, file.originalname)
//   }
// })

// const upload = multer({ storage })

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
    // eslint-disable-next-line no-console
    console.log(error)
    const { message } = error
    res.status(400).send({ error: message })
  }
}

router.post(
  '/item/:mediatype',
  async (
    req: Request & { body: any }, // to do: set up a itemFields type
    res: Response
  ): Promise<void> => {
    try {
      /* create item with requested metadata */
      const metadata = req.body
      const { mediatype } = req.params
      const response = await createItem(metadata, <Mediatype>mediatype || 'data')
      handleResponse(res, response)
    } catch (error: any) {
      handleError(res, error)
    }
  }
)

router.get('/item', async (_req: Request, res: Response): Promise<void> => {
  try {
    handleResponse(res, await getItems())
  } catch (error: any) {
    handleError(res, error)
  }
})


// router.post(
//   '/recording',
//   upload.fields([
//     { name: 'audioUpload', maxCount: 1 },
//     { name: 'imageUpload', maxCount: 1 }
//   ]),
//   async (
//     req: Request & { body: any },
//     res: Response
//   ): Promise<void> => {
//     try {
//       handleResponse(res, await createItem(req))
//     } catch (error: any) {
//       handleError(res, error)
//     }
//   }
// )


// router.put(
//   '/recording/:id',
//   async (
//     req: Request & { body: RecordingFields },
//     res: Response
//   ): Promise<void> => {
//     try {
//       handleResponse(res, await updateRecording(req))
//     } catch (error: any) {
//       handleError(res, error)
//     }
//   }
// )

// router.get('/recording', async (_req: Request, res: Response): Promise<void> => {
//   try {
//     handleResponse(res, await getRecordings())
//   } catch (error: any) {
//     handleError(res, error)
//   }
// })

// router.get(
//   '/recording/:id',
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { id } = req.params
//       handleResponse(res, await getRecording(id))
//     } catch (error: any) {
//       handleError(res, error)
//     }
//   }
// )

export default router
