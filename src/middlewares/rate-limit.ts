import type { Context } from 'hono'
import type { Next } from 'hono/types'
import { RATE_LIMIT_ENABLED, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../env'

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function getKey(c: Context): string {
    const token = c.req.header('Authorization')?.replace('Bearer ', '') || ''
    if (token) {
        return `token:${token}`
    }
    return `ip:${c.req.header('x-forwarded-for') || 'unknown'}`
}

export async function rateLimitMiddleware(c: Context, next: Next) {
    if (!RATE_LIMIT_ENABLED) {
        return next()
    }

    const key = getKey(c)
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW }
        store.set(key, entry)
    }

    entry.count++

    if (entry.count > RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return c.json(
            { error: 'Rate limit exceeded' },
            429,
            { 'Retry-After': String(retryAfter) },
        )
    }

    return next()
}
