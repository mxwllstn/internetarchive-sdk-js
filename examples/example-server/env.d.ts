declare global {
  namespace NodeJS {
    interface ProcessEnv {
      IA_TOKEN: string
    }
  }
}

export {}
