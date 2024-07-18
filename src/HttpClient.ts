import { z } from 'zod'
import { type Endpoint } from './endpoints.js'
import { IaModuleError, IaApiError } from './errors.js'
import { IaOptions } from './schema.js'
import { parseZodErrorToString } from './utils.js'
export type IaOptions = z.infer<typeof IaOptions>

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
    (this.token = token, this.options = options)
  }

  checkToken = () => {
    if (!this.token) {
      throw new IaModuleError('API token required.')
    }
  }

  makeRequest = async (endpoint: Endpoint, options?: RequestOptions): Promise<unknown> => {
    const { path, params, body, data } = options ?? {}
    endpoint.auth && this.checkToken()
    const baseUrl = endpoint.baseUrl
    const apiUrl = baseUrl + (path ? `/${path}` : '') + (params ? `?${new URLSearchParams(params)}` : '')

    const headers = {
      ...(endpoint.auth && { authorization: `LOW ${this.token}` }),
      ...options?.headers,
    }

    try {
      IaOptions.parse(this.options)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const error = 'Invalid options args: ' + parseZodErrorToString(err)
        throw new IaModuleError(error)
      }
    }

    try {
      if (data && body) {
        throw new IaModuleError('Cannot pass data and body data at the same time.')
      }

      const response = await fetch(apiUrl, {
        headers,
        method: endpoint.method,
        ...(body && { body: JSON.stringify(body) }),
        ...(data && { body: data }),
      })
      if (!response.ok) {
        const message = response.status === 403 ? 'archive.org token is incorrect.' : endpoint?.emptyBody ? response.statusText : JSON.parse(await response.text())?.error || response.statusText
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
