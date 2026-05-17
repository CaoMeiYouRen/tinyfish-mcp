import type { Context } from 'hono'
import type { Next } from 'hono/types'
import { AUTH_ENABLED, AUTH_TOKEN, AUTH_TOKENS } from '../env'

export async function authMiddleware(c: Context, next: Next) {
    if (!AUTH_ENABLED) {
        return next()
    }

    const validTokens = [AUTH_TOKEN, ...AUTH_TOKENS].filter(Boolean)

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
