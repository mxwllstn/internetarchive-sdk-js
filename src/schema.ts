import { z } from 'zod'

export const IaOptions = z.object({
  testmode: z.boolean().optional(),
  setScanner: z.boolean().optional(),
})
