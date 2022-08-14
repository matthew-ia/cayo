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

const errorLogger = (msg, options = { prefix: '[cayo]' }) => {
  const { prefix } = options;
  if (prefix === false) {
    console.log(chalk.red.bold(msg));
  } else {
    console.log(chalk.red.bold(prefix, msg));
  }
}

export const logger = { 
  log: infoLogger,
  error: errorLogger,
}