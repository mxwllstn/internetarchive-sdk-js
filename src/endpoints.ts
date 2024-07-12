export interface Endpoint {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE'
  baseUrl?: string
  path: string
  args: string[]
  auth: boolean
  emptyBody?: boolean
}

export default {
  createItem: {
    method: 'PUT',
    baseUrl: 'https://s3.us.archive.org',
    auth: true,
    emptyBody: true,
  } as Endpoint,
  getItems: {
    method: 'GET',
    baseUrl: 'https://archive.org/advancedsearch.php',
    auth: false,
  } as Endpoint,
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
  getItemTasks: {
    method: 'GET',
    baseUrl: 'https://archive.org/services/tasks.php',
    auth: true,
  } as Endpoint,
}
