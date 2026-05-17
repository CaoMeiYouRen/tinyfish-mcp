import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSearchQuery = vi.fn()

vi.mock('@tiny-fish/sdk', () => ({
    TinyFish: class {
        search = { query: mockSearchQuery }
    },
}))

import { TinyFishSearchAdapter } from '../../src/adapters/tinyfish-search'

describe('TinyFishSearchAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should map SDK response to SearchResponse', async () => {
        mockSearchQuery.mockResolvedValue({
            query: 'test query',
            results: [
                {
                    position: 1,
                    site_name: 'example.com',
                    title: 'Test Title',
                    snippet: 'Test snippet',
                    url: 'https://example.com',
                },
            ],
            total_results: 5,
            page: 0,
        })

        const adapter = new TinyFishSearchAdapter('test-key')
        const result = await adapter.search({ query: 'test query' })

        expect(result).toEqual({
            query: 'test query',
            results: [
                {
                    position: 1,
                    siteName: 'example.com',
                    title: 'Test Title',
                    snippet: 'Test snippet',
                    url: 'https://example.com',
                },
            ],
            totalResults: 5,
            page: 0,
        })
    })

    it('should pass all params to SDK', async () => {
        mockSearchQuery.mockResolvedValue({
            query: 'test',
            results: [],
            total_results: 0,
            page: 0,
        })

        const adapter = new TinyFishSearchAdapter('test-key')
        await adapter.search({ query: 'test', page: 2, location: 'US', language: 'en' })

        expect(mockSearchQuery).toHaveBeenCalledWith({
            query: 'test',
            page: 2,
            location: 'US',
            language: 'en',
        })
    })

    it('should handle null/undefined page field', async () => {
        mockSearchQuery.mockResolvedValue({
            query: 'test',
            results: [],
            total_results: 0,
            page: null,
        })

        const adapter = new TinyFishSearchAdapter('test-key')
        const result = await adapter.search({ query: 'test' })
        expect(result.page).toBe(0)
    })

    it('should propagate SDK errors', async () => {
        mockSearchQuery.mockRejectedValue(new Error('SDK Error'))

        const adapter = new TinyFishSearchAdapter('test-key')
        await expect(adapter.search({ query: 'test' })).rejects.toThrow('SDK Error')
    })
})
