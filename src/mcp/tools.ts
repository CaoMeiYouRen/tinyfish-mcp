export const SEARCH_TOOL = {
    name: 'search',
    title: 'Search the web',
    description: '通过 TinyFish 搜索API进行网络搜索，返回包含标题、URL、摘要的结构化结果。支持通过 excludedDomains 排除指定域名，默认会过滤一批低质量内容站点。',
    annotations: {
        readOnlyHint: true,
    },
} as const

export const FETCH_TOOL = {
    name: 'fetch',
    title: 'Fetch web page content',
    description: '通过 TinyFish Fetch API 获取指定 URL 的完整网页内容，支持 Markdown/HTML 等格式。可同时抓取最多 10 个 URL',
    annotations: {
        readOnlyHint: true,
    },
} as const
