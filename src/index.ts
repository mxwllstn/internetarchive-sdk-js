import fs from 'fs'
import HttpClient from './HttpClient.js'
import endpoints from './endpoints.js'
import { type IaOptions, CreateItemRequestHeaders, Mediatype, FileUpload, CreateItemResponse, UpdateItemParams, UpdateItemRequestPatch, UpdateItemRequestData, UpdateItemResponse, GetItemResponse, UploadFileParams, UploadFileHeaders, GetItemTasksResponse, TaskCriteria, GetItemsResponse, GetItemsParams, CreateItemParams } from './types.js'
import { isASCII, getPackageInfo } from './utils.js'
export * from './types.js'

const defaultIaOptions = {
  testmode: false,
  setScanner: true,
}

class InternetArchive {
  token?: string | null
  options?: IaOptions
  httpClient: HttpClient
  static default: typeof InternetArchive
  /**
   * Provides access to Internet Archive APIs through methods
   *
   * @param token - {@link https://archive.org/developers/tutorial-get-ia-credentials.html S3-like API Key} formatted as "accesskey:secretkey" (required for all methods except getItem or getItems)
   * @param options - InternetArchive API options
   * @param options.testmode - Option to add item to {@link https://archive.org/details/test_collection Test Collection} (auto deletes in 30 days) - default FALSE
   * @param options.setScanner - option to add scanner metadata for internetarchive-sdk-js - default TRUE
   * @see {@link https://archive.org/developers/tutorial-get-ia-credentials.html Archive.org - Get your Internet Archive credentials}
   * @see {@link https://archive.org/details/test_collection Archive.org - Test Collection}
   */
  constructor(token?: string, options: IaOptions = {}) {
    this.token = token ?? null
    this.options = {
      testmode: options?.testmode ?? defaultIaOptions.testmode,
      setScanner: options?.setScanner ?? defaultIaOptions.setScanner,
    }
    this.httpClient = new HttpClient(token, this.options)
  }

  /**
   * Creates an Item in a Collection (Uploads a file and adds metadata).
   *
   * @param item - identifier, collection, mediatype, upload, metadata.
   * @param item.identifier - The unique identifier for the item.
   * @param item.collection - The collection that the item belongs to.
   * @param item.mediatype - The item mediatype.
   * @param item.upload - The item upload.
   * @param item.metadata - The item metadata (optional).
   * @returns The item identifier, metadata, and upload filename.
   *
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
  async createItem(item: {
    identifier: string
    collection: string
    mediatype: Mediatype
    upload: FileUpload
    metadata?: Record<string, unknown>
  }): Promise<CreateItemResponse> {
    const { identifier, collection, mediatype, upload, metadata } = item as CreateItemParams
    const packageInfo = await getPackageInfo()
    const isTestCollection = this.options?.testmode ?? collection === 'test_collection'
    const headers = {
      'x-amz-auto-make-bucket': 1,
      'x-archive-interactive-priority': 1,
      'x-archive-meta-identifier': identifier,
      'x-archive-meta-mediatype': mediatype,
      ...(isTestCollection && collection !== 'test_collection' ? { 'x-archive-meta01-collection': collection, 'x-archive-meta02-collection': 'test_collection' } : { 'x-archive-meta-collection': collection }),
      ...(this.options?.setScanner && packageInfo && { 'x-archive-meta-scanner': `${packageInfo.name}-${packageInfo.version}` }),
    } as CreateItemRequestHeaders

    if (metadata && Object.keys(metadata).length) {
      /* filters out identifier, mediatype, or collection from metadata */
      Object.entries(metadata).filter(([key, _val]) => !['identifier', 'mediatype', 'collection', 'scanner'].includes(key)).forEach(([key, val]) => {
        /* returns error if item create contains ascii characters */
        if (val !== '' && !isASCII(val as string)) {
          throw new Error(`Metadata values cannot include ASCII characters on Item Create requests. Field <${key}> contains value '${val}'.`)
        }
        headers[`x-archive-meta-${key}`] = val
      })
    }

    const data = upload?.data ?? (upload?.path ? fs.readFileSync(upload.path) : null)

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

  /**
   * Returns Items based on filters and options.
   *
   * @param items - filters (collection, subject, creator) and options (fields, rows).
   * @param items.filters - Filter by collection, subject, creator.
   * @param items.options - Options to specify fields returned and amount of items.
   * @returns The responseHeader and response with items as docs.
   *
   * @see {@link https://archive.org/advancedsearch.php Archive.org - Advanced Search API}
   */
  async getItems(items: {
    filters: {
      collection?: string
      subject?: string
      creator?: string
    }
    options?: {
      fields?: string
      rows?: string
    }
  }): Promise<GetItemsResponse> {
    const { filters, options } = items as GetItemsParams
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

  /**
   * Returns an Item by identifier.
   *
   * @param identifier - The unique identifier for the item.
   * @returns Item metadata, file paths, and other info.
   *
   * @see {@link https://archive.org/developers/metadata.html Archive.org - Item Metadata API API}
   */
  async getItem(identifier: string): Promise<GetItemResponse> {
    return await this.httpClient.makeRequest(endpoints.getItem, { path: identifier }) as any
  }

  /**
   * Updates an Item by identifier and metadata.
   *
   * @param identifier - The unique identifier for the item.
   * @param metadata - The item metadata.
   * @returns Update response (success, error, task_id, log).
   *
   * @see {@link https://archive.org/developers/metadata.html Archive.org - Item Metadata API API}
   */
  async updateItem(identifier: string, metadata: UpdateItemParams): Promise<UpdateItemResponse> {
    const packageInfo = await getPackageInfo()
    if (this.options?.setScanner && packageInfo) {
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

  /**
   * Uploads a File to a parent Item.
   *
   * @param upload - identifier, mediatype, file.
   * @param upload.identifier - The unique identifier of the parent item.
   * @param upload.mediatype - The upload mediatype.
   * @param upload.file - The upload file.
   *
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
  async uploadFile(upload: {
    identifier: string
    mediatype: Mediatype
    file: FileUpload
  }): Promise<void> {
    const { identifier, mediatype, file } = upload as UploadFileParams
    const { path, filename, data: buffer } = file || {}
    const headers = {
      'x-archive-interactive-priority': 1,
      'x-archive-meta-mediatype': mediatype,
    } as UploadFileHeaders

    if (!filename) {
      throw new Error('filename required')
    }
    const data = buffer ?? (path ? fs.readFileSync(path) : null)
    if (!data) {
      throw new Error('buffer or path required')
    }
    return await this.httpClient.makeRequest(endpoints.uploadFile, { data, path: `${identifier}/${filename}`, headers }) as any
  }

  /**
   * Deletes a File from an Item.
   *
   * @param path - The path of the file [identifier/filename].
   *
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
  async deleteFile(path: string): Promise<void> {
    const headers = {
      'x-archive-cascade-delete': 1,
    }
    return await this.httpClient.makeRequest(endpoints.deleteFile, { path, headers }) as any
  }

  /**
   * Returns Tasks from an Item.
   *
   * @param identifier - identifier, mediatype, file.
   * @param criteria - Parameters to filter item tasks.
   *
   * @see {@link https://archive.org/developers/tasks.html Archive.org - Tasks API}
   */
  async getItemTasks(identifier: string, criteria?: TaskCriteria): Promise<GetItemTasksResponse> {
    const params = {
      identifier,
      ...criteria,
    }
    return await this.httpClient.makeRequest(endpoints.getTask, { params }) as any
  }
}

export default InternetArchive
