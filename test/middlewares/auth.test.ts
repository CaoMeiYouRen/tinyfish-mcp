import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'

let authEnabled = true
let authToken = 'secret'
let authTokens: string[] = []

vi.mock('../../src/env', async () => {
    const actual = await vi.importActual<typeof import('../../src/env')>('../../src/env')
    return {
        ...actual,
        get AUTH_ENABLED() { return authEnabled },
        get AUTH_TOKEN() { return authToken },
        get AUTH_TOKENS() { return authTokens },
    }
})

import { authMiddleware } from '../../src/middlewares/auth'

function createApp() {
    const app = new Hono()
    app.use('*', authMiddleware)
    app.get('/protected', (c) => c.json({ ok: true }))
    return app
}

describe('authMiddleware', () => {
    beforeEach(() => {
        authEnabled = true
        authToken = 'secret'
        authTokens = []
    })

    it('should skip auth when disabled', async () => {
        authEnabled = false
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(200)
    })

    it('should return 401 when no Authorization header', async () => {
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer wrong' },
        })
        expect(res.status).toBe(401)
    })

    it('should pass with valid Bearer token', async () => {
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer secret' },
        })
        expect(res.status).toBe(200)
    })

    it('should pass with valid AUTH_TOKENS', async () => {
        authToken = ''
        authTokens = ['token1', 'token2']
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer token2' },
        })
        expect(res.status).toBe(200)
    })

    it('should pass when no tokens configured', async () => {
        authToken = ''
        authTokens = []
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(200)
    })
})
