import { createLogger } from 'vite';
import chalk from 'chalk';

export const infoLogger = createLogger('info', {
  prefix: chalk.magenta.bold('[cayo]'),
  // allowClearScreen: true,
});
export const errorLogger = createLogger('warn', {
  prefix: chalk.red.bold('[cayo]'),
  // allowClearScreen: true,
});

export const logger = { 
  log: infoLogger,
  error: errorLogger,
}