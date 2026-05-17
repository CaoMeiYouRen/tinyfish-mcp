import { describe, it, expect, vi } from 'vitest'
import { SearchService, type SearchProvider, type SearchResponse } from '../../src/services/search'

const mockResponse: SearchResponse = {
    query: 'test',
    results: [
        {
            position: 1,
            siteName: 'example.com',
            title: 'Example',
            snippet: 'An example result',
            url: 'https://example.com',
        },
    ],
    totalResults: 1,
    page: 0,
}

function createMockProvider(): SearchProvider {
    return {
        search: vi.fn().mockResolvedValue(mockResponse),
    }
}

describe('SearchService', () => {
    it('should call provider search and return results', async () => {
        const provider = createMockProvider()
        const service = new SearchService(provider)
        const result = await service.search({ query: 'test' })
        expect(provider.search).toHaveBeenCalledWith({ query: 'test' })
        expect(result).toEqual(mockResponse)
    })

    it('should propagate provider errors', async () => {
        const provider: SearchProvider = {
            search: vi.fn().mockRejectedValue(new Error('API Error')),
        }
        const service = new SearchService(provider)
        await expect(service.search({ query: 'test' })).rejects.toThrow('API Error')
    })

    it('should pass all params to provider', async () => {
        const provider = createMockProvider()
        const service = new SearchService(provider)
        await service.search({ query: 'test', page: 2, location: 'US', language: 'en' })
        expect(provider.search).toHaveBeenCalledWith({
            query: 'test',
            page: 2,
            location: 'US',
            language: 'en',
        })
    })
})
