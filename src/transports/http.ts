import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/handler'

let transportPromise: Promise<WebStandardStreamableHTTPServerTransport> | null = null
let currentApiKey: string | null = null

async function getTransport(apiKey: string): Promise<WebStandardStreamableHTTPServerTransport> {
    if (transportPromise && currentApiKey === apiKey) {
        return transportPromise
    }

    currentApiKey = apiKey

    transportPromise = (async () => {
        const server = createMcpServer(apiKey)
        const transport = new WebStandardStreamableHTTPServerTransport()
        await server.connect(transport)
        return transport
    })()

    return transportPromise
}

export async function mcpHttpHandler(c: Context): Promise<Response> {
    const apiKey = env(c).TINYFISH_API_KEY || ''
    const transport = await getTransport(apiKey)
    return transport.handleRequest(c.req.raw)
}
