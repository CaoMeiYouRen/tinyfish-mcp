export interface FetchParams {
    urls: string[]
    format?: 'markdown' | 'html' | 'json'
    links?: boolean
    imageLinks?: boolean
}

export interface FetchResult {
    url: string
    finalUrl: string
    title?: string
    description?: string
    language?: string
    author?: string
    publishedDate?: string
    text: string
    links?: string[]
    imageLinks?: string[]
    latencyMs?: number
    format: string
}

export interface FetchError {
    url: string
    error: string
    status?: number
}

export interface FetchResponse {
    results: FetchResult[]
    errors: FetchError[]
}

export interface FetchProvider {
    fetch(params: FetchParams): Promise<FetchResponse>
}

export class FetchService {
    constructor(private provider: FetchProvider) {}

    async fetch(params: FetchParams): Promise<FetchResponse> {
        return this.provider.fetch(params)
    }
}
