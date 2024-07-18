import fs from 'fs'
import HttpClient from './HttpClient.js'
import endpoints from './endpoints.js'
import packageInfo from './package-info.json' assert { type: 'json' }
import { type IaOptions, CreateItemParams, CreateItemRequestHeaders, CreateItemResponse, GetItemParams, UpdateItemParams, UpdateItemRequestPatch, UpdateItemRequestData, UpdateItemResponse, GetItemsResponse, GetItemResponse, UploadFileParams, UploadFileHeaders, GetItemTasksResponse, TaskCriteria } from './types.js'
import { isASCII } from './utils'
export * from './types'

const defaultIaOptions = {
  testmode: false,
  setScanner: true,
}

class InternetArchive {
  token?: string | null
  options?: IaOptions
  httpClient: HttpClient
  static default: typeof InternetArchive
  constructor(token?: string, options: IaOptions = {}) {
    this.token = token ?? null
    this.options = {
      testmode: options?.testmode ?? defaultIaOptions.testmode,
      setScanner: options?.setScanner ?? defaultIaOptions.setScanner,
    }
    this.httpClient = new HttpClient(token, this.options)
  }

  async createItem({ identifier, collection, mediatype, upload, metadata }: CreateItemParams): Promise<CreateItemResponse> {
    const isTestCollection = this.options?.testmode ?? collection === 'test_collection'

    const headers = {
      'x-amz-auto-make-bucket': 1,
      'x-archive-interactive-priority': 1,
      'x-archive-meta-identifier': identifier,
      'x-archive-meta-mediatype': mediatype,
      ...(isTestCollection && collection !== 'test_collection' ? { 'x-archive-meta01-collection': collection, 'x-archive-meta02-collection': 'test_collection' } : { 'x-archive-meta-collection': collection }),
      ...(this.options?.setScanner && { 'x-archive-meta-scanner': `${packageInfo.name}-${packageInfo.version}` }),
    } as CreateItemRequestHeaders

    if (metadata && Object.keys(metadata).length) {
      Object.entries(metadata).forEach(([key, val]) => {
        /* returns error if item create contains ascii characters */
        if (!isASCII(val as string)) {
          throw new Error(`Metadata values cannot exist on Item Create requests ASCII characters. Field <${key}> contains value '${val}'.`)
        }
        headers[`x-archive-meta-${key}`] = val
      })
    }

    const data = upload?.data ? upload?.data : upload?.path ? fs.readFileSync(upload.path) : null

    const path = upload?.filename ? `${identifier}/${upload?.filename}` : identifier

    await this.httpClient.makeRequest(endpoints.createItem, { data, path, headers }) as any

    /* returns id and metadata */
    return {
      identifier,
      metadata,
      ...(upload && {
        upload: {
          filename: upload.filename,
          path,
        },
      }),
    } as CreateItemResponse
  }

  async getItems({
    filters,
    options,
  }: GetItemParams): Promise<GetItemsResponse> {
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

  async getItem(id: string): Promise<GetItemResponse> {
    return await this.httpClient.makeRequest(endpoints.getItem, { path: id }) as any
  }

  async updateItem(identifier: string, metadata: UpdateItemParams): Promise<UpdateItemResponse> {
    if (this.options?.setScanner) {
      metadata.scanner = `${packageInfo.name}-${packageInfo.version}`
    }
    const patch = Object.keys(metadata).map((key) => {
      return {
        op: 'add',
        path: `/${key}`,
        value: metadata[key],
      } as UpdateItemRequestPatch
    })
    const data = {
      '-target': 'metadata',
      '-patch': patch,
    } as UpdateItemRequestData

    const headers = {
      'content-type': 'application/x-www-form-urlencoded;',
    }
    return await this.httpClient.makeRequest(endpoints.updateItem, { path: identifier, data, headers }) as any
  }

  async uploadFile({ identifier, mediatype, file }: UploadFileParams): Promise<void> {
    const { path, filename, data: buffer } = file || {}
    const headers = {
      'x-archive-interactive-priority': 1,
      'x-archive-meta-mediatype': mediatype,
    } as UploadFileHeaders

    if (!filename) {
      throw new Error('filename required')
    }
    const data = buffer ? buffer : path ? fs.readFileSync(path) : null
    if (!data) {
      throw new Error('buffer or path required')
    }
    return await this.httpClient.makeRequest(endpoints.uploadFile, { data, path: `${identifier}/${filename}`, headers }) as any
  }

  async deleteFile(path: string): Promise<void> {
    const headers = {
      'x-archive-cascade-delete': 1,
    }
    return await this.httpClient.makeRequest(endpoints.deleteFile, { path, headers }) as any
  }

  async getItemTasks(id: string, criteria?: TaskCriteria): Promise<GetItemTasksResponse> {
    const params = {
      identifier: id,
      ...criteria,
    }
    return await this.httpClient.makeRequest(endpoints.getTask, { params }) as any
  }
}

export default InternetArchive
