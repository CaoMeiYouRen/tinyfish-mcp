import { z } from 'zod'

const DomainPatternSchema = z.string().trim().min(1).max(255).regex(/^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i)

export const SearchParamsSchema = z.object({
    query: z.string().min(1),
    page: z.number().int().min(0).max(10).optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    excludedDomains: z.array(DomainPatternSchema).max(50).optional(),
})

export type SearchParamsInput = z.infer<typeof SearchParamsSchema>
