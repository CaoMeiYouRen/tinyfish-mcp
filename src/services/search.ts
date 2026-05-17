export interface SearchParams {
    query: string
    page?: number
    location?: string
    language?: string
}

export interface SearchResult {
    position: number
    siteName: string
    title: string
    snippet: string
    url: string
}

export interface SearchResponse {
    query: string
    results: SearchResult[]
    totalResults: number
    page: number
}

export interface SearchProvider {
    search(params: SearchParams): Promise<SearchResponse>
}

export class SearchService {
    constructor(private provider: SearchProvider) {}

    async search(params: SearchParams): Promise<SearchResponse> {
        return this.provider.search(params)
    }
}
