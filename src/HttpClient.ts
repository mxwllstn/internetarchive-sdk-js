import { ZodError } from 'zod'
import qs from 'qs'
import { type Endpoint } from './endpoints.js'
import { IaModuleError, IaApiError } from './errors.js'
import { parseZodErrorToString } from './utils.js'
import { IaOptions } from './types.js'
import * as schema from './schema.js'

const { ia } = schema

interface RequestOptions {
  path?: string
  params?: Record<string, any>
  body?: Record<string, any>
  data?: any
  headers?: Record<string, any>
}

class HttpClient {
  token?: string | null
  options: IaOptions
  static default: typeof HttpClient
  constructor(token?: string | null, options: IaOptions = {}) {
    this.token = token
    this.options = options
  }

  checkToken = () => {
    if (!this.token) {
      throw new IaModuleError('API token required.')
    }
  }

  makeRequest = async (endpoint: Endpoint, options?: RequestOptions): Promise<unknown> => {
    const { path, params, body, data } = options ?? {}
    if (endpoint.auth) this.checkToken()
    const baseUrl = endpoint.baseUrl
    const apiUrl = baseUrl + (path ? `/${path}` : '') + (params ? `?${new URLSearchParams(params)}` : '')

    const headers = {
      ...(endpoint.auth && { authorization: `LOW ${this.token}` }),
      ...options?.headers,
    }

    try {
      ia.Options.parse(this.options)
    } catch (err) {
      if (err instanceof ZodError) {
        const error = 'Invalid options args: ' + parseZodErrorToString(err)
        throw new IaModuleError(error)
      }
    }

    try {
      if (data && body) {
        throw new IaModuleError('Cannot pass data and body data at the same time.')
      }

      if (endpoint?.schema) {
        try {
          if (endpoint.schema.type === 'headers') schema?.[endpoint.schema.name].parse(headers)
          if (endpoint.schema.type === 'data') schema?.[endpoint.schema.name].parse(data)
          if (endpoint.schema.type === 'qs') schema?.[endpoint.schema.name].parse(data)
          if (endpoint.schema.type === 'body') schema?.[endpoint.schema.name].parse(body)
        } catch (err) {
          if (err instanceof ZodError) {
            console.error(err)
            const error = `Invalid ${endpoint.schema.name} - ${parseZodErrorToString(err)}`
            throw new IaModuleError(error)
          }
        }
      }

      const response = await fetch(apiUrl, {
        headers,
        method: endpoint.method,
        ...(body && { body: JSON.stringify(body) }),
        ...(data && { body: endpoint.schema.type === 'qs' ? qs.stringify(data) : data }),
      })
      if (!response.ok) {
        const message = response.status === 403 ? 'archive.org token is incorrect or you do not have access to this collection.' : endpoint?.emptyBody ? response.statusText : JSON.parse(await response.text())?.error ?? response.statusText
        throw new IaApiError(message, response.status)
      } else {
        return endpoint?.emptyBody
          ? {
              status: response?.status,
            }
          : await response.json()
      }
    } catch (err: any) {
      throw new IaApiError(err?.cause?.message ?? err?.message, err.statusCode)
    }
  }
}

export default HttpClient
