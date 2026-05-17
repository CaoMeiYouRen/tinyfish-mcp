import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimitMiddleware } from '../../src/middlewares/rate-limit'

function createApp() {
    const app = new Hono()
    app.use('*', rateLimitMiddleware)
    app.get('/api', (c) => c.json({ ok: true }))
    return app
}

describe('rateLimitMiddleware', () => {
    beforeEach(() => {
        delete process.env.RATE_LIMIT_ENABLED
        delete process.env.RATE_LIMIT_MAX
        delete process.env.RATE_LIMIT_WINDOW
    })

    it('should skip rate limit when disabled', async () => {
        process.env.RATE_LIMIT_ENABLED = 'false'
        const app = createApp()
        for (let i = 0; i < 10; i++) {
            const res = await app.request('/api')
            expect(res.status).toBe(200)
        }
    })

    it('should allow requests within the limit', async () => {
        process.env.RATE_LIMIT_ENABLED = 'true'
        process.env.RATE_LIMIT_MAX = '3'
        const app = createApp()
        for (let i = 0; i < 3; i++) {
            const res = await app.request('/api')
            expect(res.status).toBe(200)
        }
    })

    it('should return 429 when limit exceeded', async () => {
        process.env.RATE_LIMIT_ENABLED = 'true'
        process.env.RATE_LIMIT_MAX = '2'
        const app = createApp()

        await app.request('/api')
        await app.request('/api')
        const res = await app.request('/api')
        expect(res.status).toBe(429)
    })
})
