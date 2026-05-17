import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ErrorHandler, NotFoundHandler } from 'hono/types'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'
import logger from '@/middlewares/logger'

export const errorhandler: ErrorHandler = (error: Error, c: Context) => {
    const message = process.env.NODE_ENV === 'production' ? `${error.name}: ${error.message}` : error.stack
    let status: StatusCode = 500
    if (error instanceof HTTPException) {
        const response = error.getResponse()
        status = response.status as StatusCode
    }
    const method = c.req.method
    const requestPath = c.req.path
    logger.error(`Error in ${method} ${requestPath}: \n${message}`)
    return c.json({
        status,
        message,
    }, status as ContentfulStatusCode)
}

export const notFoundHandler: NotFoundHandler = (c: Context) => {
    const method = c.req.method
    const requestPath = c.req.path
    const message = `Cannot ${method} ${requestPath}`
    logger.warn(message)
    return c.json({
        status: 404,
        message,
    }, 404)
}
