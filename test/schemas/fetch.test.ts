import { describe, it, expect } from 'vitest'
import { FetchParamsSchema } from '../../src/schemas/fetch'

describe('FetchParamsSchema', () => {
    it('should pass with valid urls', () => {
        const result = FetchParamsSchema.safeParse({ urls: ['https://example.com'] })
        expect(result.success).toBe(true)
    })

    it('should fail if urls is missing', () => {
        const result = FetchParamsSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('should fail if urls is empty array', () => {
        const result = FetchParamsSchema.safeParse({ urls: [] })
        expect(result.success).toBe(false)
    })

    it('should fail if urls exceeds 10', () => {
        const urls = Array.from({ length: 11 }, (_, i) => `https://example.com/page${i}`)
        const result = FetchParamsSchema.safeParse({ urls })
        expect(result.success).toBe(false)
    })

    it('should fail if url is invalid', () => {
        const result = FetchParamsSchema.safeParse({ urls: ['not-a-url'] })
        expect(result.success).toBe(false)
    })

    it('should accept optional format', () => {
        const result = FetchParamsSchema.safeParse({ urls: ['https://example.com'], format: 'markdown' })
        expect(result.success).toBe(true)
    })

    it('should fail on invalid format', () => {
        const result = FetchParamsSchema.safeParse({ urls: ['https://example.com'], format: 'pdf' })
        expect(result.success).toBe(false)
    })

    it('should accept links and imageLinks flags', () => {
        const result = FetchParamsSchema.safeParse({
            urls: ['https://example.com'],
            links: true,
            imageLinks: true,
        })
        expect(result.success).toBe(true)
    })
})
