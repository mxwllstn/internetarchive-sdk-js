export class IaModuleError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'IaModuleError'
  }
}

export class IaApiError extends Error {
  statusCode?: number
  constructor(message: string | undefined, statusCode?: number) {
    super(message)
    this.name = 'IaApiError'
    this.statusCode = statusCode
  }
}
