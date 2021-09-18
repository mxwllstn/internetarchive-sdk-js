import fs from 'fs'
import { randomBytes } from 'crypto'
import slugify from 'slugify'
import qs from 'qs'
import axios, { AxiosResponse } from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const { IA_ACCESS_KEY, IA_SECRET_KEY } = process.env
const IA_AUTH_TOKEN = `${IA_ACCESS_KEY}:${IA_SECRET_KEY}`

export type Mediatype = 'audio' | 'collection' | 'data' | 'etree' | 'image' | 'movies' | 'software' | 'texts' | 'web'

export interface CreateItemResponse {
  status: number
  data: { id: string }
}

export interface FileUpload {
  path: string
  filename: string
}

const InternetArchive = {
  createItem: async (
    collection: string,
    creator: string,
    metadata: Record<string, unknown>,
    mediatype: Mediatype,
    testmode?: boolean
  ): Promise<CreateItemResponse> => {
    const headers = {
      authorization: `LOW ${IA_AUTH_TOKEN}`,
      'x-amz-auto-make-bucket': 1,
      'x-archive-meta01-collection': collection,
      ...(testmode && { 'x-archive-meta02-collection': 'test_collection' }),
      'x-archive-meta-creator': creator,
      'x-archive-meta-mediatype': mediatype
    }

    Object.keys(metadata).forEach(key => {
      (headers as Record<string, unknown>)[`x-archive-meta-${key}`] = metadata[key]
    })

    const uuid = randomBytes(8).toString('hex').toLowerCase()
    const title = metadata.title ? `${creator}-${metadata.title}-${uuid}` : `${collection}-${uuid}`
    const id = slugify(title, {
      replacement: '-',
      lower: true,
      strict: true,
      trim: true
    })

    /* create document with metadata */
    await axios.put(`http://s3.us.archive.org/${id}`, null, { headers })
    return {
      status: 201,
      data: { id }
    }
  },
  getItems: async (collection: string, creator: string, fields: string): Promise<AxiosResponse> => {
    const params = {
      q: `((collection:${collection})(creator:"${creator}"))`,
      ...(fields && { 'fl[]': fields.replace(/ /g, '') }),
      rows: '10000',
      output: 'json',
      'sort[]': 'date desc'
    }
    return await axios.get('https://archive.org/advancedsearch.php', { params })
  },
  getItem: async (id: string): Promise<AxiosResponse> => await axios.get(`https://archive.org/metadata/${id}`),
  updateItem: async (id: string, metadata: Record<string, unknown>): Promise<AxiosResponse> => {
    const patch = Object.keys(metadata).map(key => {
      return {
        op: 'add',
        path: `/${key}`,
        value: metadata[key]
      }
    })
    const data = {
      '-target': 'metadata',
      '-patch': patch,
      access: IA_ACCESS_KEY,
      secret: IA_SECRET_KEY
    }
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    }
    return await axios.post(`http://archive.org/metadata/${id}`, qs.stringify(data), { headers })
  },
  uploadFiles: async (files: FileUpload[] | { path: string; filename: string }[], id: string): Promise<void> => {
    await Promise.all(
      files.map(async file => {
        await InternetArchive.uploadFile(file, id)
      })
    )
  },
  uploadFile: async (file: FileUpload, id: string): Promise<void> => {
    const { path, filename } = file
    const headers = {
      authorization: `LOW ${IA_AUTH_TOKEN}`
    }
    const data = fs.readFileSync(path)
    return await axios.put(`http://s3.us.archive.org/${id}/${filename}`, data, { headers })
  }
}
export default InternetArchive
