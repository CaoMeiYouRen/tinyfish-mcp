import dotenv from 'dotenv'
import { getRuntimeKey } from 'hono/adapter'
const result = dotenv.config({
    path: [
        '.env.local',
        '.env',
    ],
})
const envObj = result.parsed

if (process.env.NODE_ENV === 'development') {
    console.log('envObj', envObj)
}

export const __PROD__ = process.env.NODE_ENV === 'production'
export const __DEV__ = process.env.NODE_ENV === 'development'

export const PORT = parseInt(process.env.PORT || '3000') || 3000

// 是否写入日志到文件
export const LOGFILES = process.env.LOGFILES === 'true'

export const LOG_LEVEL = process.env.LOG_LEVEL || (__DEV__ ? 'silly' : 'http')

// 判断当前运行时 是否是 Cloudflare Workers
export const IS_CLOUDFLARE_WORKERS = process.env.RUNTIME_KEY === 'cloudflare-workers' || getRuntimeKey() === 'workerd'

export function getApiKey(): string {
    const key = process.env.TINYFISH_API_KEY
    if (!key) {
        throw new Error('TINYFISH_API_KEY is required')
    }
    return key
}

export const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'
export const AUTH_TOKEN = process.env.AUTH_TOKEN || ''
export const AUTH_TOKENS = process.env.AUTH_TOKENS ? process.env.AUTH_TOKENS.split(',').map((t) => t.trim()).filter(Boolean) : []

export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false'
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000') || 60000
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '30') || 30
