import { TinyFish } from '@tiny-fish/sdk'
import type { SearchParams, SearchProvider, SearchResponse } from '../services/search'

export class TinyFishSearchAdapter implements SearchProvider {
    private client: TinyFish

    constructor(apiKey: string) {
        this.client = new TinyFish({ apiKey })
    }

    async search(params: SearchParams): Promise<SearchResponse> {
        const response = await this.client.search.query({
            query: params.query,
            page: params.page,
            location: params.location,
            language: params.language,
        })
        return {
            query: response.query,
            results: response.results.map((r) => ({
                position: r.position,
                siteName: r.site_name,
                title: r.title,
                snippet: r.snippet,
                url: r.url,
            })),
            totalResults: response.total_results,
            page: response.page ?? 0,
        }
    }
}
