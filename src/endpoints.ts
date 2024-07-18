export type EndpointSchemaName = 'CreateItemRequestHeaders' | 'UpdateItemRequestData' | 'UploadFileHeaders'
export type EndpointSchemaType = 'data' | 'qs' | 'params' | 'body' | 'headers'
export interface EndpointSchema {
  type: EndpointSchemaType
  name: EndpointSchemaName
}

export interface Endpoint {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE'
  baseUrl?: string
  schema: EndpointSchema
  auth: boolean
  emptyBody?: boolean
}

export default {
  /* ias3 Internet archive S3-like API - https://archive.org/developers/ias3.html */
  createItem: {
    method: 'PUT',
    baseUrl: 'https://s3.us.archive.org',
    schema: {
      type: 'headers',
      name: 'CreateItemRequestHeaders',
    },
    auth: true,
    emptyBody: true,
  } as Endpoint,

  /* Item Metadata API - https://archive.org/developers/metadata.html */
  getItem: {
    method: 'GET',
    baseUrl: 'https://archive.org/metadata',
    auth: false,
  } as Endpoint,

  updateItem: {
    method: 'POST',
    baseUrl: 'https://archive.org/metadata',
    schema: {
      type: 'qs',
      name: 'UpdateItemRequestData',
    },
    auth: true,
  } as Endpoint,

  /* Advanced Search API - https://archive.org/advancedsearch.php */
  getItems: {
    method: 'GET',
    baseUrl: 'https://archive.org/advancedsearch.php',
    auth: false,
  } as Endpoint,

  /* ias3 Internet archive S3-like API - https://archive.org/developers/ias3.html */
  uploadFile: {
    method: 'PUT',
    baseUrl: 'http://s3.us.archive.org',
    schema: {
      type: 'headers',
      name: 'UploadFileHeaders',
    },
    auth: true,
    emptyBody: true,
  } as Endpoint,

  deleteFile: {
    method: 'DELETE',
    baseUrl: 'http://s3.us.archive.org',
    auth: true,
    emptyBody: true,
  } as Endpoint,

  /* Tasks API - https://archive.org/developers/tasks.html */
  getTask: {
    method: 'GET',
    baseUrl: 'https://archive.org/services/tasks.php',
    auth: true,
  } as Endpoint,

}
