import fs from 'fs'
import { randomBytes } from 'crypto'
import slugify from 'slugify'
import qs from 'qs'
import axios, { AxiosResponse } from 'axios'

export type Mediatype = 'audio' | 'collection' | 'data' | 'etree' | 'image' | 'movies' | 'software' | 'texts' | 'web'

export interface CreateItemResponse {
  status: number
  data: { id: string }
}
export interface FileUpload {
  path: string
  filename: string
}
class InternetArchive {
  token: string
  collection: string
  creator: string
  options?: { testmode: boolean }
  constructor(token: string, collection: string, creator: string, options?: { testmode: boolean }) {
    (this.token = token), (this.collection = collection), (this.creator = creator), (this.options = options)
  }

  createItem = async (
    metadata: Record<string, unknown>,
    mediatype: Mediatype
  ): Promise<CreateItemResponse> => {
    const headers = {
      authorization: `LOW ${this.token}`,
      'x-amz-auto-make-bucket': 1,
      'x-archive-meta01-collection': this.collection,
      ...(this.options?.testmode && { 'x-archive-meta02-collection': 'test_collection' }),
      'x-archive-meta-creator': this.creator,
      'x-archive-meta-mediatype': mediatype
    }

    Object.keys(metadata).forEach(key => {
      (headers as Record<string, unknown>)[`x-archive-meta-${key}`] = metadata[key]
    })

    const uuid = randomBytes(8).toString('hex').toLowerCase()
    const title = metadata.title ? `${this.creator}-${metadata.title}-${uuid}` : `${this.collection}-${uuid}`
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
  }

  getItems = async (fields?: string):Promise<AxiosResponse> => {
    const params = {
      q: `((collection:${this.collection})(creator:"${this.creator}"))`,
      ...(fields && { 'fl[]': fields.replace(/ /g, '') }),
      rows: '10000',
      output: 'json',
      'sort[]': 'date desc'
    }
    return await axios.get('https://archive.org/advancedsearch.php', { params })
  }

  getItem = async (id: string): Promise<AxiosResponse> => {
    return await axios.get(`https://archive.org/metadata/${id}`)
  }

  updateItem = async (id: string, metadata: Record<string, unknown>): Promise<AxiosResponse> => {
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
      access: this.token.split(':')[0],
      secret: this.token.split(':')[1]
    }
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    }
    return await axios.post(`http://archive.org/metadata/${id}`, qs.stringify(data), { headers })
  }

  uploadFiles = async (files: FileUpload[] | { path: string; filename: string }[], id: string): Promise<void> => {
    await Promise.all(
      files.map(async file => {
        await this.uploadFile(file, id)
      })
    )
  }

  uploadFile = async (file: FileUpload, id: string): Promise<void> => {
    const { path, filename } = file
    const headers = {
      authorization: `LOW ${this.token}`,
      'x-archive-interactive-priority': 1
    }
    const data = fs.readFileSync(path)
    return await axios.put(`http://s3.us.archive.org/${id}/${filename}`, data, { headers })
  }
}

export default InternetArchive
