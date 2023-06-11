import fs from 'fs'
import { randomBytes } from 'crypto'
import slugify from 'slugify'
import qs from 'qs'
import axios from 'axios'

export type Mediatype = 'audio' | 'collection' | 'data' | 'etree' | 'image' | 'movies' | 'software' | 'texts' | 'web'
export type Id = string | number | boolean
export type Item = Record<string, Id | FileUpload | FileUpload[] | Params>
export type Params = Record<string, any>
export type List = Item[]
export interface FileUpload {
  path: string
  filename: string
}
export interface ItemsResponse {
  response: { docs: Item[] }
}
class InternetArchive {
  token?: string
  options?: { testmode?: boolean }
  static default: typeof InternetArchive
  constructor(token: string, options?: { testmode?: boolean }) {
    (this.token = token), (this.options = options)
  }

  createItem = async (metadata: Record<string, string>, mediatype: Mediatype): Promise<Item> => {
    if (!this.token) {
      throw new Error('api token required')
    }
    if (!mediatype) {
      throw new Error(
        'mediatype must be specified. possible mediatypes include: audio, collection, data, etree, image, movies, software, texts, web'
      )
    }
    const { collection } = metadata || {}
    if (!collection) {
      throw new Error('collection is required.')
    }
    const headers = {
      authorization: `LOW ${this.token}`,
      'x-amz-auto-make-bucket': 1,
      ...(metadata.collection && { 'x-archive-meta01-collection': metadata.collection }),
      ...(this.options?.testmode && { 'x-archive-meta02-collection': 'test_collection' }),
      'x-archive-meta-mediatype': mediatype
    }

    Object.keys(metadata).forEach(key => {
      (headers as Record<string, unknown>)[`x-archive-meta-${key}`] = metadata[key]
    })

    const uuid = randomBytes(8).toString('hex').toLowerCase()
    const title =
      metadata.title && metadata.subject
        ? `${metadata.subject}-${metadata.title}-${uuid}`
        : metadata.collection
        ? `${metadata.collection}-${uuid}`
        : uuid
    const id = slugify(title, {
      replacement: '-',
      lower: true,
      strict: true,
      trim: true
    })

    /* create document with metadata */
    await axios.put(`http://s3.us.archive.org/${id}`, null, { headers })
    return { id }
  }

  getItems = async (
    filters: { collection?: string; subject?: string; creator?: string },
    options: {
      fields?: string
      rows?: string
    }
  ): Promise<ItemsResponse> => {
    const { fields, rows } = options || {}
    const params = {
      q:
        filters?.collection && filters?.subject && filters?.creator
          ? `collection:(${filters?.collection})&subject:("${filters?.subject}")&creator:("${filters?.creator}")`
          : filters?.collection && filters?.subject
          ? `collection:(${filters.collection})&subject:("${filters.subject}")`
          : filters?.collection && filters?.creator
          ? `collection:(${filters.collection})&creator:("${filters.creator}")`
          : filters?.subject && filters?.creator
          ? `subject:(${filters.subject})&creator:("${filters.creator}")`
          : filters?.collection
          ? `collection:(${filters.collection})`
          : filters?.subject
          ? `subject:(${filters.subject})`
          : filters?.creator
          ? `creator:(${filters.creator})`
          : null,
      ...(fields && { 'fl[]': fields.replace(/ /g, '') }),
      rows: Number(rows) || 50,
      output: 'json',
      'sort[]': 'date desc'
    }
    if (!params.q) {
      throw new Error('collection, subject, or creator required')
    }
    return (await axios.get('https://archive.org/advancedsearch.php', { params })).data
  }

  getItem = async (id: string): Promise<Item> => {
    return (await axios.get(`https://archive.org/metadata/${id}`)).data
  }

  updateItem = async (id: string, metadata: Item): Promise<Item> => {
    if (!this.token) {
      throw new Error('api token required')
    }
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
    return (await axios.post(`http://archive.org/metadata/${id}`, qs.stringify(data), { headers })).data
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
    return (await axios.put(`http://s3.us.archive.org/${id}/${filename}`, data, { headers })).data
  }
}

/* exports for commonjs and es6 */
module.exports = InternetArchive
module.exports.InternetArchive = InternetArchive
module.exports.default = InternetArchive
export default InternetArchive
