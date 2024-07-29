import { z } from 'zod'
import { ia, Mediatype, UpdateItemRequestData, UpdateItemRequestPatch, CreateItemRequestHeaders, UploadFileHeaders } from './schema.js'

export type IaOptions = z.infer<typeof ia.Options>
export type Mediatype = z.infer<typeof Mediatype>
export type CreateItemRequestHeaders = z.infer<typeof CreateItemRequestHeaders>
export type UpdateItemParams = Record<string, unknown>
export type UpdateItemRequestPatch = z.infer<typeof UpdateItemRequestPatch>
export type UpdateItemRequestData = z.infer<typeof UpdateItemRequestData>
export type UploadFileHeaders = z.infer<typeof UploadFileHeaders>

export interface CreateItemParams {
  identifier: string
  collection: string
  mediatype: Mediatype
  upload: FileUpload
  metadata?: Record<string, unknown>
}

export interface CreateItemResponse {
  identifier: string
  metadata: Record<string, unknown>
  upload: {
    filename: string
  }
}

export interface UpdateItemResponse {
  success: boolean
  error?: string
  task_id?: number
  log?: string
}

export interface GetItemsParams {
  filters: {
    collection?: string
    subject?: string
    creator?: string
  }
  options: {
    fields?: string
    rows?: string
  }
}

export interface GetItemsResponse {
  responseHeader: {
    status: number
    QTtime: number
    params: Record<string, unknown>
  }
  response: {
    numFound: number
    start: 0
    docs: Record<string, unknown>[]
  }
}

export interface GetItemResponse {
  created: number
  d1: string
  d2: string
  dir: string
  files: Record<string, unknown>[]
  files_count: number
  metadata: Record<string, unknown>
  server: string
  uniq: number
  workable_servers: string[]
}

export interface FileUpload {
  filename: string
  path?: string
  data?: Buffer
}

export interface UploadFileParams {
  identifier: string
  mediatype: Mediatype
  file: FileUpload
}

export interface GetItemTasksResponse {
  succes: boolean
  value: Record<string, unknown>
}

/**
 * @see {@link https://archive.org/developers/tasks.html#criteria| Archive.org - Tasks API - Criteria}
 */
export interface TaskCriteria {
  task_id?: number
  server?: string
  cmd?: string
  args?: string
  submitter?: string
  priority?: number
  wait_admin?: number
}
