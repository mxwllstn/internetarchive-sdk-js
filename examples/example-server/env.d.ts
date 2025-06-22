declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Internet Archive Token (S3-Like API Key) (required) */
      IA_TOKEN: string
    }
  }
}

export {}
