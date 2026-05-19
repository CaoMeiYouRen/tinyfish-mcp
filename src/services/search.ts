export interface SearchParams {
    query: string
    page?: number
    location?: string
    language?: string
    excludedDomains?: string[]
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

// 内置一批低质量内容站点，默认会过滤掉它们的搜索结果。
export const BUILTIN_SEARCH_EXCLUDED_DOMAINS = [
    'buzzle.com',
    'suite101.com',
    'brighthub.com',
    'examiner.com',
    'baijiahao.baidu.com',
    'sohu.com',
    '163.com',
    'toutiao.com',
    '360kuai.com',
    'yidianzixun.com',
    'uc.cn',
    'jb51.net',
    'cnblogs.com',
    'csdn.net',
    'segmentfault.com',
] as const

function normalizeExcludedDomain(domain: string): string {
    const trimmed = domain.trim().toLowerCase().replace(/^\*\./, '')
    if (!trimmed) {
        return ''
    }
    try {
        const url = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? new URL(trimmed) : new URL(`https://${trimmed}`)
        return url.hostname.toLowerCase().replace(/^www\./, '')
    } catch {
        return trimmed.replace(/^www\./, '').replace(/:\d+$/, '').replace(/\/.*$/, '')
    }
}

function collectExcludedDomains(...groups: ReadonlyArray<readonly string[] | undefined>): string[] {
    const seen = new Set<string>()
    const domains: string[] = []

    for (const group of groups) {
        for (const domain of group ?? []) {
            const normalizedDomain = normalizeExcludedDomain(domain)
            if (!normalizedDomain || seen.has(normalizedDomain)) {
                continue
            }
            seen.add(normalizedDomain)
            domains.push(normalizedDomain)
        }
    }

    return domains
}

function appendExcludedDomainOperators(query: string, excludedDomains: readonly string[]): string {
    if (excludedDomains.length === 0) {
        return query
    }
    return `${query} ${excludedDomains.map((domain) => `-site:${domain}`).join(' ')}`
}

function isExcludedResultUrl(url: string, excludedDomains: readonly string[]): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
        return excludedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
    } catch {
        return false
    }
}

export class SearchService {
    constructor(
        private provider: SearchProvider,
        private defaultExcludedDomains: readonly string[] = [],
    ) {}

    async search(params: SearchParams): Promise<SearchResponse> {
        const excludedDomains = collectExcludedDomains(
            BUILTIN_SEARCH_EXCLUDED_DOMAINS,
            this.defaultExcludedDomains,
            params.excludedDomains,
        )
        const providerParams: SearchParams = {
            ...params,
            query: appendExcludedDomainOperators(params.query, excludedDomains),
        }
        delete providerParams.excludedDomains
        const result = await this.provider.search(providerParams)

        return {
            ...result,
            query: params.query,
            results: result.results.filter((item) => !isExcludedResultUrl(item.url, excludedDomains)),
        }
    }
}
