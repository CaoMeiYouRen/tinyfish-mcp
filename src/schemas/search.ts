import { z } from 'zod'

export const SearchParamsSchema = z.object({
    query: z.string().min(1),
    page: z.number().int().min(0).max(10).optional(),
    location: z.string().optional(),
    language: z.string().optional(),
})

export type SearchParamsInput = z.infer<typeof SearchParamsSchema>
