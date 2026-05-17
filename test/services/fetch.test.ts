import { describe, it, expect, vi } from 'vitest'
import { FetchService, type FetchProvider, type FetchResponse } from '../../src/services/fetch'

const mockResponse: FetchResponse = {
    results: [
        {
            url: 'https://example.com',
            finalUrl: 'https://example.com/',
            title: 'Example',
            text: '# Hello World',
            format: 'markdown',
        },
    ],
    errors: [],
}

function createMockProvider(): FetchProvider {
    return {
        fetch: vi.fn().mockResolvedValue(mockResponse),
    }
}

describe('FetchService', () => {
    it('should call provider fetch and return results', async () => {
        const provider = createMockProvider()
        const service = new FetchService(provider)
        const result = await service.fetch({ urls: ['https://example.com'] })
        expect(provider.fetch).toHaveBeenCalledWith({ urls: ['https://example.com'] })
        expect(result).toEqual(mockResponse)
    })

    it('should propagate provider errors', async () => {
        const provider: FetchProvider = {
            fetch: vi.fn().mockRejectedValue(new Error('API Error')),
        }
        const service = new FetchService(provider)
        await expect(service.fetch({ urls: ['https://example.com'] })).rejects.toThrow('API Error')
    })

    it('should pass all params to provider', async () => {
        const provider = createMockProvider()
        const service = new FetchService(provider)
        await service.fetch({
            urls: ['https://example.com'],
            format: 'markdown',
            links: true,
            imageLinks: false,
        })
        expect(provider.fetch).toHaveBeenCalledWith({
            urls: ['https://example.com'],
            format: 'markdown',
            links: true,
            imageLinks: false,
        })
    })
})
