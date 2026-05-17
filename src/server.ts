import { serve } from '@hono/node-server'
import { PORT } from './env'
import app from './app'
import logger from './middlewares/logger'

serve({
    fetch: app.fetch,
    port: PORT,
})

logger.info(`tinyfish-mcp HTTP server started at http://localhost:${PORT}`)
