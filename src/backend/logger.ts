import pino from 'pino';

import { config } from '@/backend/config';

export const logger =
  process.env.NODE_ENV === 'production'
    ? pino({ level: config.logging.level })
    : pino({
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
        level: config.logging.level,
      });
