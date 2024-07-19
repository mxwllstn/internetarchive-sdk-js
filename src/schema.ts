import { z } from 'zod'
import { oneOf } from './utils.js'

export const ia = {
  Options: z.object({
    testmode: z.boolean().optional(),
    setScanner: z.boolean().optional(),
  }),
}

export const Mediatype = z.enum(['audio', 'collection', 'data', 'etree', 'image', 'movies', 'software', 'texts', 'web'])

export const UploadFileHeaders = z.object({
  'x-archive-interactive-priority': z.number().optional(),
  'x-archive-meta-mediatype': Mediatype,
})

export const CreateItemRequestHeaders = z.intersection(
  z.object({
    'authorization': z.string(),
    'x-amz-auto-make-bucket': z.number(),
    'x-archive-interactive-priority': z.number().optional(),
    'x-archive-meta-identifier': z.string().min(1).or(z.number()),
    'x-archive-meta-collection': z.string().min(1).or(z.number()).optional(),
    'x-archive-meta01-collection': z.string().min(1).or(z.number()).optional(),
    'x-archive-meta02-collection': z.string().min(1).or(z.number()).optional(),
    'x-archive-meta-mediatype': Mediatype,
  }).superRefine(oneOf('x-archive-meta-collection', 'x-archive-meta01-collection')),
  z.record(z.string(), z.any()),
)

export const UpdateItemRequestPatch = z.object({
  op: z.enum(['add']),
  path: z.string(),
  value: z.string(),
})

export const UpdateItemRequestData = z.object({
  '-target': z.enum(['metadata']),
  '-patch': z.array(UpdateItemRequestPatch),
})
