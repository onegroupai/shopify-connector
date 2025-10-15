import { createServer } from './server.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

const app = createServer();
app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'connector listening');
});