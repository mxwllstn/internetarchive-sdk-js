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
  /**
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
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

  /**
   * @see {@link https://archive.org/developers/metadata.html Archive.org - Item Metadata API API}
   */
  getItem: {
    method: 'GET',
    baseUrl: 'https://archive.org/metadata',
    auth: false,
  } as Endpoint,

  /**
   * @see {@link https://archive.org/developers/metadata.html Archive.org - Item Metadata API API}
   */
  updateItem: {
    method: 'POST',
    baseUrl: 'https://archive.org/metadata',
    schema: {
      type: 'qs',
      name: 'UpdateItemRequestData',
    },
    auth: true,
  } as Endpoint,

  /**
   * @see {@link https://archive.org/advancedsearch.php Archive.org - Advanced Search API}
   */
  getItems: {
    method: 'GET',
    baseUrl: 'https://archive.org/advancedsearch.php',
    auth: false,
  } as Endpoint,

  /**
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
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

  /**
   * @see {@link https://archive.org/developers/ias3.html Archive.org - ias3 Internet archive S3-like API}
   */
  deleteFile: {
    method: 'DELETE',
    baseUrl: 'http://s3.us.archive.org',
    auth: true,
    emptyBody: true,
  } as Endpoint,

  /**
   * @see {@link https://archive.org/developers/tasks.html Archive.org - Tasks API}
   */
  getTask: {
    method: 'GET',
    baseUrl: 'https://archive.org/services/tasks.php',
    auth: true,
  } as Endpoint,

}
