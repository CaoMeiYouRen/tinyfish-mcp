#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from '../mcp/handler'

async function main() {
    const server = createMcpServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

main().catch((err) => {
    console.error('MCP Stdio server error:', err)
    process.exit(1)
})
