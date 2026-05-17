import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/handler'

let serverPromise: Promise<ReturnType<typeof createMcpServer>> | null = null
let currentApiKey: string | null = null

async function getServer(apiKey: string) {
    if (serverPromise && currentApiKey === apiKey) {
        return serverPromise
    }
    currentApiKey = apiKey
    serverPromise = (async () => createMcpServer(apiKey))()
    return serverPromise
}

export async function mcpHttpHandler(c: Context): Promise<Response> {
    const apiKey = env(c).TINYFISH_API_KEY || ''
    const server = await getServer(apiKey)
    const transport = new WebStandardStreamableHTTPServerTransport()
    await server.connect(transport)
    return transport.handleRequest(c.req.raw)
}
