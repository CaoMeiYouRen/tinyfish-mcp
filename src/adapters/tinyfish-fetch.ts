import { TinyFish } from '@tiny-fish/sdk'
import type { FetchParams, FetchProvider, FetchResponse } from '../services/fetch'

export class TinyFishFetchAdapter implements FetchProvider {
    private client: TinyFish

    constructor(apiKey: string) {
        this.client = new TinyFish({ apiKey })
    }

    async fetch(params: FetchParams): Promise<FetchResponse> {
        const response = await this.client.fetch.getContents({
            urls: params.urls,
            format: params.format,
            links: params.links,
            image_links: params.imageLinks,
        })
        return {
            results: response.results.map((r) => ({
                url: r.url,
                finalUrl: r.final_url ?? r.url,
                title: r.title ?? undefined,
                description: r.description ?? undefined,
                language: r.language ?? undefined,
                author: r.author ?? undefined,
                publishedDate: r.published_date ?? undefined,
                text: typeof r.text === 'string' ? r.text : JSON.stringify(r.text ?? ''),
                links: r.links,
                imageLinks: r.image_links,
                latencyMs: r.latency_ms ?? undefined,
                format: r.format,
            })),
            errors: response.errors?.map((e) => ({
                url: e.url,
                error: e.error,
            })) ?? [],
        }
    }
}
