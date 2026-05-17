import type { Context } from 'hono'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/handler'

let transportPromise: Promise<WebStandardStreamableHTTPServerTransport> | null = null

async function getTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
    if (transportPromise) {
        return transportPromise
    }

    transportPromise = (async () => {
        const server = createMcpServer()
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
        })
        await server.connect(transport)
        return transport
    })()

    return transportPromise
}

export async function mcpHttpHandler(c: Context): Promise<Response> {
    const transport = await getTransport()
    return transport.handleRequest(c.req.raw)
}
