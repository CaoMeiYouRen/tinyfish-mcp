import type { Context } from 'hono'
import type { Next } from 'hono/types'
import { env } from 'hono/adapter'

export async function authMiddleware(c: Context, next: Next) {
    const authEnabled = env(c).AUTH_ENABLED !== 'false'
    if (!authEnabled) {
        return next()
    }

    const authToken = env(c).AUTH_TOKEN || ''
    const authTokens = env(c).AUTH_TOKENS
        ? env(c).AUTH_TOKENS.split(',').map((t) => t.trim()).filter(Boolean)
        : []

    const validTokens = [authToken, ...authTokens].filter(Boolean)

    if (validTokens.length === 0) {
        return next()
    }

    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
        return c.json({ error: 'Missing Authorization header' }, 401)
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader

    if (!validTokens.includes(token)) {
        return c.json({ error: 'Invalid token' }, 401)
    }

    return next()
}
