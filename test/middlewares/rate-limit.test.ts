import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'

let rateLimitEnabled = true
let rateLimitMax = 3

vi.mock('../../src/env', async () => {
    const actual = await vi.importActual<typeof import('../../src/env')>('../../src/env')
    return {
        ...actual,
        get RATE_LIMIT_ENABLED() { return rateLimitEnabled },
        get RATE_LIMIT_MAX() { return rateLimitMax },
    }
})

import { rateLimitMiddleware } from '../../src/middlewares/rate-limit'

function createApp() {
    const app = new Hono()
    app.use('*', rateLimitMiddleware)
    app.get('/api', (c) => c.json({ ok: true }))
    return app
}

describe('rateLimitMiddleware', () => {
    beforeEach(() => {
        rateLimitEnabled = true
        rateLimitMax = 3
    })

    it('should skip rate limit when disabled', async () => {
        rateLimitEnabled = false
        const app = createApp()
        for (let i = 0; i < 10; i++) {
            const res = await app.request('/api')
            expect(res.status).toBe(200)
        }
    })

    it('should allow requests within the limit', async () => {
        const app = createApp()
        for (let i = 0; i < 3; i++) {
            const res = await app.request('/api')
            expect(res.status).toBe(200)
        }
    })

    it('should return 429 when limit exceeded', async () => {
        rateLimitMax = 2
        const app = createApp()

        await app.request('/api')
        await app.request('/api')
        const res = await app.request('/api')
        expect(res.status).toBe(429)
    })
})
