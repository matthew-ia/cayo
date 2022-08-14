import { createLogger } from 'vite';
import chalk from 'chalk';

export const infoLogger = createLogger('info', {
  prefix: chalk.magenta.bold('[cayo]'),
  // allowClearScreen: true,
});
export const errorLoggerVite = createLogger('error', {
  prefix: chalk.red.bold('[cayo]'),
  // allowClearScreen: true,
});

const errorLogger = (msg) => {
  errorLoggerVite.error(chalk.red.bold(msg));
}

export const logger = { 
  log: infoLogger,
  error: errorLogger,
}