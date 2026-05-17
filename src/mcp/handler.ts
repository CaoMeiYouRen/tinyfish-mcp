import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { name, version } from '../../package.json'
import { TinyFishSearchAdapter } from '../adapters/tinyfish-search'
import { TinyFishFetchAdapter } from '../adapters/tinyfish-fetch'
import { SearchService } from '../services/search'
import { FetchService } from '../services/fetch'
import { SearchParamsSchema } from '../schemas/search'
import { FetchParamsSchema } from '../schemas/fetch'
import { getApiKey } from '../env'
import { SEARCH_TOOL, FETCH_TOOL } from './tools'

export function createMcpServer(apiKey?: string) {
    const key = apiKey || getApiKey()

    const searchService = new SearchService(new TinyFishSearchAdapter(key))
    const fetchService = new FetchService(new TinyFishFetchAdapter(key))

    const server = new McpServer({
        name,
        version,
    })

    server.registerTool(
        SEARCH_TOOL.name,
        {
            title: SEARCH_TOOL.title,
            description: SEARCH_TOOL.description,
            inputSchema: SearchParamsSchema,
            annotations: SEARCH_TOOL.annotations,
        },
        async (params) => {
            const result = await searchService.search(params)
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            }
        },
    )

    server.registerTool(
        FETCH_TOOL.name,
        {
            title: FETCH_TOOL.title,
            description: FETCH_TOOL.description,
            inputSchema: FetchParamsSchema,
            annotations: FETCH_TOOL.annotations,
        },
        async (params) => {
            const result = await fetchService.fetch(params)
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            }
        },
    )

    return server
}
