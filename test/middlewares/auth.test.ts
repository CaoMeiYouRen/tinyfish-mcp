import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../src/middlewares/auth'

function createApp() {
    const app = new Hono()
    app.use('*', authMiddleware)
    app.get('/protected', (c) => c.json({ ok: true }))
    return app
}

describe('authMiddleware', () => {
    beforeEach(() => {
        delete process.env.AUTH_ENABLED
        delete process.env.AUTH_TOKEN
        delete process.env.AUTH_TOKENS
    })

    it('should skip auth when disabled', async () => {
        process.env.AUTH_ENABLED = 'false'
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(200)
    })

    it('should return 401 when no Authorization header', async () => {
        process.env.AUTH_ENABLED = 'true'
        process.env.AUTH_TOKEN = 'secret'
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
        process.env.AUTH_ENABLED = 'true'
        process.env.AUTH_TOKEN = 'secret'
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer wrong' },
        })
        expect(res.status).toBe(401)
    })

    it('should pass with valid Bearer token', async () => {
        process.env.AUTH_ENABLED = 'true'
        process.env.AUTH_TOKEN = 'secret'
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer secret' },
        })
        expect(res.status).toBe(200)
    })

    it('should pass with valid AUTH_TOKENS', async () => {
        process.env.AUTH_ENABLED = 'true'
        process.env.AUTH_TOKEN = ''
        process.env.AUTH_TOKENS = 'token1,token2'
        const app = createApp()
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer token2' },
        })
        expect(res.status).toBe(200)
    })

    it('should pass when no tokens configured', async () => {
        process.env.AUTH_ENABLED = 'true'
        process.env.AUTH_TOKEN = ''
        process.env.AUTH_TOKENS = ''
        const app = createApp()
        const res = await app.request('/protected')
        expect(res.status).toBe(200)
    })
})
