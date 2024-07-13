import fs from 'fs'
import qs from 'qs'
import HttpClient from './HttpClient.js'
import endpoints from './endpoints.js'
import { generateItemIdFromMetadata } from './utils.js'

export type Mediatype = 'audio' | 'collection' | 'data' | 'etree' | 'image' | 'movies' | 'software' | 'texts' | 'web'
export type Id = string | number | boolean
export type Item = Record<string, any>
export type List = Item[]

export interface FileUploadHeaders {
  'authorization': string
  'x-amz-auto-make-bucket': number
  'x-archive-meta01-collection': string | number
  'x-archive-meta02-collection'?: string | number
  'x-archive-meta-mediatype': Mediatype
  [key: `x-archive-meta-${string}`]: string | number
}
export interface FileUpload {
  filename: string
  path?: string | undefined
  data?: Buffer | undefined
}

export interface ItemsResponse {
  response: { docs: Item[] }
}

export interface IaOptions {
  testmode?: boolean
}

export interface TaskCriteria {
  task_id?: number
  server?: string
  cmd?: string
  args?: string
  submitter?: string
  priority?: number
  wait_admin?: number
}

class InternetArchive {
  token?: string
  options?: IaOptions
  httpClient: HttpClient
  static default: typeof InternetArchive
  constructor(token: string, options: IaOptions = {}) {
    (this.token = token), (this.options = options)
    this.httpClient = new HttpClient(token, options)
  }

  async createItem(collection: string, mediatype: Mediatype, data: Item): Promise<Item> {
    if (!this.token) {
      throw new Error('api token required')
    }
    if (!mediatype) {
      throw new Error(
        'mediatype must be specified. possible mediatypes include: audio, collection, data, etree, image, movies, software, texts, web',
      )
    }

    /* does not include audioFile and imageFile in metadata */
    const { audioFile, imageFile, ...metadata } = data || {}
    /* extracts identifier from metadata */
    const { identifier } = metadata || {}
    /* required for updateItem */
    metadata.collection = collection
    metadata.mediatype = mediatype

    const headers = {
      'x-amz-auto-make-bucket': 1,
      'x-archive-meta01-collection': collection,
      ...(this.options?.testmode && { 'x-archive-meta02-collection': 'test_collection' }),
      'x-archive-meta-mediatype': mediatype,
    } as FileUploadHeaders

    Object.keys({ identifier, audioFile, imageFile }).forEach((key) => {
      if (metadata?.[key]) {
        headers[`x-archive-meta-${key}`] = String(metadata[key])
      }
    })

    const id = identifier || generateItemIdFromMetadata(metadata)
    metadata.identifier = id

    /* create document with metadata */
    await this.httpClient.makeRequest(endpoints.createItem, { path: id, headers }) as any
    await this.updateItem(id, metadata)

    /* returns id and metadata */
    return {
      id,
      metadata,
    }
  }

  async getItems(
    filters: { collection?: string, subject?: string, creator?: string },
    options: {
      fields?: string
      rows?: string
    },
  ): Promise<ItemsResponse> {
    const { fields, rows } = options || {}
    const params = {
      'q':
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
      'rows': Number(rows) || 50,
      'output': 'json',
      'sort[]': 'date desc',
    }
    if (!params.q) {
      throw new Error('collection, subject, or creator required')
    }
    return await this.httpClient.makeRequest(endpoints.getItems, { params }) as any
  }

  async getItem(id: string): Promise<Item> {
    return await this.httpClient.makeRequest(endpoints.getItem, { path: id }) as any
  }

  async updateItem(id: string, metadata: Item): Promise<Item> {
    if (!this.token) {
      throw new Error('api token required')
    }
    const patch = Object.keys(metadata).map((key) => {
      return {
        op: 'add',
        path: `/${key}`,
        value: metadata[key],
      }
    })
    const data = {
      '-target': 'metadata',
      '-patch': patch,
      'access': this.token.split(':')[0],
      'secret': this.token.split(':')[1],
    }
    const headers = {
      'content-type': 'application/x-www-form-urlencoded;',
    }
    return await this.httpClient.makeRequest(endpoints.updateItem, { path: id, data: qs.stringify(data), headers }) as any
  }

  async uploadFiles(files: FileUpload[] | { path: string, filename: string }[], id: string): Promise<void> {
    await Promise.all(
      files.filter(x => x).map(async (file) => {
        await this.uploadFile(file, id)
      }),
    )
  }

  async uploadFile(file: FileUpload, id: string): Promise<void> {
    const { path, filename, data: buffer } = file || {}
    const headers = {
      'x-archive-interactive-priority': 1,
    }
    if (!filename) {
      throw new Error('filename required')
    }
    const data = buffer ? buffer : path ? fs.readFileSync(path) : null
    if (!data) {
      throw new Error('buffer or path required')
    }
    return await this.httpClient.makeRequest(endpoints.uploadFile, { data, path: `${id}/${filename}`, headers }) as any
  }

  async deleteFile(path: string): Promise<void> {
    const headers = {
      'x-archive-cascade-delete': 1,
    }
    return await this.httpClient.makeRequest(endpoints.deleteFile, { path, headers }) as any
  }

  async getItemTasks(id: string, criteria?: TaskCriteria): Promise<Item> {
    const params = {
      identifier: id,
      ...criteria,
    }
    return await this.httpClient.makeRequest(endpoints.getItemTasks, { params }) as any
  }
}

export default InternetArchive
