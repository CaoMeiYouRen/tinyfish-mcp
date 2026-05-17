import { z } from 'zod'

export const FetchParamsSchema = z.object({
    urls: z.array(z.url()).min(1).max(10),
    format: z.enum(['markdown', 'html', 'json']).optional(),
    links: z.boolean().optional(),
    imageLinks: z.boolean().optional(),
})

export type FetchParamsInput = z.infer<typeof FetchParamsSchema>
