import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/handler'

export async function mcpHttpHandler(c: Context): Promise<Response> {
    const apiKey = env(c).TINYFISH_API_KEY || ''
    const server = createMcpServer(apiKey)
    const transport = new WebStandardStreamableHTTPServerTransport()
    await server.connect(transport)
    return transport.handleRequest(c.req.raw)
}
