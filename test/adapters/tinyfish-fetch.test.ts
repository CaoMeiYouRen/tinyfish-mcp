import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetContents = vi.fn()

vi.mock('@tiny-fish/sdk', () => ({
    TinyFish: class {
        fetch = { getContents: mockGetContents }
    },
}))

import { TinyFishFetchAdapter } from '../../src/adapters/tinyfish-fetch'

describe('TinyFishFetchAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should map SDK response to FetchResponse', async () => {
        mockGetContents.mockResolvedValue({
            results: [
                {
                    url: 'https://example.com',
                    final_url: 'https://example.com/',
                    title: 'Example',
                    description: 'A description',
                    language: 'en',
                    author: 'Author',
                    published_date: '2024-01-01',
                    text: '# Hello',
                    links: ['https://example.com/link'],
                    image_links: ['https://example.com/img.png'],
                    latency_ms: 1000,
                    format: 'markdown',
                },
            ],
            errors: [],
        })

        const adapter = new TinyFishFetchAdapter('test-key')
        const result = await adapter.fetch({ urls: ['https://example.com'] })

        expect(result.results).toHaveLength(1)
        expect(result.results[0]).toMatchObject({
            url: 'https://example.com',
            finalUrl: 'https://example.com/',
            title: 'Example',
            description: 'A description',
            language: 'en',
            author: 'Author',
            publishedDate: '2024-01-01',
            text: '# Hello',
            links: ['https://example.com/link'],
            imageLinks: ['https://example.com/img.png'],
            latencyMs: 1000,
            format: 'markdown',
        })
    })

    it('should pass all params to SDK', async () => {
        mockGetContents.mockResolvedValue({ results: [], errors: [] })

        const adapter = new TinyFishFetchAdapter('test-key')
        await adapter.fetch({
            urls: ['https://a.com', 'https://b.com'],
            format: 'html',
            links: true,
            imageLinks: true,
        })

        expect(mockGetContents).toHaveBeenCalledWith({
            urls: ['https://a.com', 'https://b.com'],
            format: 'html',
            links: true,
            image_links: true,
        })
    })

    it('should handle errors array', async () => {
        mockGetContents.mockResolvedValue({
            results: [],
            errors: [
                { url: 'https://bad.com', error: 'timeout' },
            ],
        })

        const adapter = new TinyFishFetchAdapter('test-key')
        const result = await adapter.fetch({ urls: ['https://bad.com'] })

        expect(result.errors).toEqual([
            { url: 'https://bad.com', error: 'timeout' },
        ])
    })

    it('should handle JSON format text (object)', async () => {
        mockGetContents.mockResolvedValue({
            results: [
                {
                    url: 'https://example.com',
                    final_url: 'https://example.com/',
                    text: { key: 'value', nested: { a: 1 } },
                    format: 'json',
                },
            ],
            errors: [],
        })

        const adapter = new TinyFishFetchAdapter('test-key')
        const result = await adapter.fetch({ urls: ['https://example.com'], format: 'json' })

        expect(result.results[0].text).toBe('{"key":"value","nested":{"a":1}}')
    })

    it('should handle null final_url', async () => {
        mockGetContents.mockResolvedValue({
            results: [
                {
                    url: 'https://example.com',
                    final_url: null,
                    text: 'content',
                    format: 'markdown',
                },
            ],
            errors: [],
        })

        const adapter = new TinyFishFetchAdapter('test-key')
        const result = await adapter.fetch({ urls: ['https://example.com'] })

        expect(result.results[0].finalUrl).toBe('https://example.com')
    })
})
