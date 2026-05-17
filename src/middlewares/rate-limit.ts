import type { Context } from 'hono'
import type { Next } from 'hono/types'
import { env } from 'hono/adapter'

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
    const rateLimitEnabled = env(c).RATE_LIMIT_ENABLED !== 'false'
    if (!rateLimitEnabled) {
        return next()
    }

    const rateLimitWindow = parseInt(env(c).RATE_LIMIT_WINDOW || '60000') || 60000
    const rateLimitMax = parseInt(env(c).RATE_LIMIT_MAX || '30') || 30

    const key = getKey(c)
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + rateLimitWindow }
        store.set(key, entry)
    }

    entry.count++

    if (entry.count > rateLimitMax) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return c.json(
            { error: 'Rate limit exceeded' },
            429,
            { 'Retry-After': String(retryAfter) },
        )
    }

    return next()
}
