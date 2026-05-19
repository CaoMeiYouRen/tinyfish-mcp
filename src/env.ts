import { getRuntimeKey } from 'hono/adapter'

// 判断当前运行时 是否是 Cloudflare Workers
export const IS_CLOUDFLARE_WORKERS = process.env.RUNTIME_KEY === 'cloudflare-workers' || getRuntimeKey() === 'workerd'

let envObj: Record<string, string> | undefined

if (!IS_CLOUDFLARE_WORKERS) {
    try {
        const dotenv = await import('dotenv')
        const result = dotenv.config({
            path: [
                '.env.local',
                '.env',
            ],
        })
        envObj = result.parsed
    } catch {
        // 非 Node.js 环境跳过 dotenv
    }
}

if (process.env.NODE_ENV === 'development') {
    console.log('envObj', envObj)
}

export const __PROD__ = process.env.NODE_ENV === 'production'
export const __DEV__ = process.env.NODE_ENV === 'development'

export const PORT = parseInt(process.env.PORT || '3000') || 3000

function parseCsvEnv(value: string | undefined): string[] {
    return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
}

// 是否写入日志到文件
export const LOGFILES = process.env.LOGFILES === 'true'

export const LOG_LEVEL = process.env.LOG_LEVEL || (__DEV__ ? 'silly' : 'http')

export function getApiKey(): string {
    const key = process.env.TINYFISH_API_KEY
    if (!key) {
        throw new Error('TINYFISH_API_KEY is required')
    }
    return key
}

export const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'
export const AUTH_TOKEN = process.env.AUTH_TOKEN || ''
export const AUTH_TOKENS = parseCsvEnv(process.env.AUTH_TOKENS)
export const SEARCH_EXCLUDED_DOMAINS = parseCsvEnv(process.env.SEARCH_EXCLUDED_DOMAINS)

export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false'
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000') || 60000
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '30') || 30
