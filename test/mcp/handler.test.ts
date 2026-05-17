import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSearchQuery = vi.fn()
const mockGetContents = vi.fn()

vi.mock('@tiny-fish/sdk', () => ({
    TinyFish: class {
        search = { query: mockSearchQuery }
        fetch = { getContents: mockGetContents }
    },
}))

vi.mock('../../src/env', async () => {
    const actual = await vi.importActual<typeof import('../../src/env')>('../../src/env')
    return {
        ...actual,
        getApiKey: () => 'test-api-key',
    }
})

import { createMcpServer } from '../../src/mcp/handler'

describe('createMcpServer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should create server without throwing', () => {
        expect(() => createMcpServer()).not.toThrow()
    })

    it('should create server with server property', () => {
        const mcp = createMcpServer()
        expect(mcp.server).toBeDefined()
    })

    it('should be not connected initially', () => {
        const mcp = createMcpServer()
        expect(mcp.isConnected()).toBe(false)
    })
})
