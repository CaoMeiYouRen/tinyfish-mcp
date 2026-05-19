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

function createMockProvider(response: SearchResponse = mockResponse) {
    const search = vi.fn().mockResolvedValue(response)
    return {
        provider: { search } as SearchProvider,
        search,
    }
}

describe('SearchService', () => {
    it('should call provider search and return results', async () => {
        const { provider, search } = createMockProvider()
        const service = new SearchService(provider)
        const result = await service.search({ query: 'test' })
        expect(search).toHaveBeenCalledOnce()
        const calledParams = search.mock.calls[0]?.[0]
        expect(calledParams?.query).toContain('test')
        expect(calledParams?.query).toContain('-site:buzzle.com')
        expect(calledParams?.query).toContain('-site:segmentfault.com')
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
        const { provider, search } = createMockProvider()
        const service = new SearchService(provider)
        await service.search({ query: 'test', page: 2, location: 'US', language: 'en' })
        expect(search).toHaveBeenCalledWith({
            query: expect.stringContaining('test'),
            page: 2,
            location: 'US',
            language: 'en',
        })
    })

    it('should include request-level and configured excluded domains in query', async () => {
        const { provider, search } = createMockProvider()
        const service = new SearchService(provider, ['*.example.org'])

        await service.search({
            query: 'test',
            excludedDomains: ['*.Example.com', 'news.example.net'],
        })

        const calledParams = search.mock.calls[0]?.[0]
        expect(calledParams?.query).toContain('-site:example.org')
        expect(calledParams?.query).toContain('-site:example.com')
        expect(calledParams?.query).toContain('-site:news.example.net')
        expect(calledParams).not.toHaveProperty('excludedDomains')
    })

    it('should filter built-in and custom excluded domains from results', async () => {
        const { provider } = createMockProvider({
            query: 'test -site:buzzle.com -site:example.org',
            results: [
                {
                    position: 1,
                    siteName: 'buzzle.com',
                    title: 'Buzzle',
                    snippet: 'Low quality',
                    url: 'https://www.buzzle.com/article',
                },
                {
                    position: 2,
                    siteName: 'example.org',
                    title: 'Example Org',
                    snippet: 'Custom excluded',
                    url: 'https://blog.example.org/post',
                },
                {
                    position: 3,
                    siteName: 'example.com',
                    title: 'Allowed',
                    snippet: 'Kept',
                    url: 'https://example.com/post',
                },
            ],
            totalResults: 3,
            page: 0,
        })
        const service = new SearchService(provider, ['example.org'])

        const result = await service.search({ query: 'test' })

        expect(result.query).toBe('test')
        expect(result.results).toEqual([
            {
                position: 3,
                siteName: 'example.com',
                title: 'Allowed',
                snippet: 'Kept',
                url: 'https://example.com/post',
            },
        ])
    })
})
