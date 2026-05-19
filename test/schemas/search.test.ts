import { describe, it, expect } from 'vitest'
import { SearchParamsSchema } from '../../src/schemas/search'

describe('SearchParamsSchema', () => {
    it('should pass with valid params', () => {
        const result = SearchParamsSchema.safeParse({ query: 'test' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.query).toBe('test')
        }
    })

    it('should fail if query is missing', () => {
        const result = SearchParamsSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('should fail if query is empty string', () => {
        const result = SearchParamsSchema.safeParse({ query: '' })
        expect(result.success).toBe(false)
    })

    it('should accept optional page within range', () => {
        const result = SearchParamsSchema.safeParse({ query: 'test', page: 5 })
        expect(result.success).toBe(true)
    })

    it('should fail if page is out of range', () => {
        const result = SearchParamsSchema.safeParse({ query: 'test', page: 11 })
        expect(result.success).toBe(false)
    })

    it('should accept optional location and language', () => {
        const result = SearchParamsSchema.safeParse({
            query: 'test',
            location: 'US',
            language: 'en',
        })
        expect(result.success).toBe(true)
    })

    it('should accept excluded domains with wildcard patterns', () => {
        const result = SearchParamsSchema.safeParse({
            query: 'test',
            excludedDomains: ['*.sohu.com', 'baijiahao.baidu.com'],
        })

        expect(result.success).toBe(true)
    })

    it('should fail if excludedDomains contains invalid domain patterns', () => {
        const result = SearchParamsSchema.safeParse({
            query: 'test',
            excludedDomains: ['https://example.com/path'],
        })

        expect(result.success).toBe(false)
    })
})
