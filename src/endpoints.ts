export interface Endpoint {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE'
  baseUrl?: string
  path: string
  args: string[]
  auth: boolean
  emptyBody?: boolean
}

export default {
  /* ias3 Internet archive S3-like API - https://archive.org/developers/ias3.html */
  createItem: {
    method: 'PUT',
    baseUrl: 'https://s3.us.archive.org',
    auth: true,
    emptyBody: true,
  } as Endpoint,
  uploadFile: {
    method: 'PUT',
    baseUrl: 'http://s3.us.archive.org',
    auth: true,
    emptyBody: true,
  } as Endpoint,
  deleteFile: {
    method: 'DELETE',
    baseUrl: 'http://s3.us.archive.org',
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
    auth: false,
  } as Endpoint,

  /* Advanced Search API - https://archive.org/advancedsearch.php */
  getItems: {
    method: 'GET',
    baseUrl: 'https://archive.org/advancedsearch.php',
    auth: false,
  } as Endpoint,

  /* Tasks API - https://archive.org/developers/tasks.html */
  getItemTasks: {
    method: 'GET',
    baseUrl: 'https://archive.org/services/tasks.php',
    auth: true,
  } as Endpoint,
}
