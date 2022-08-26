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

const errorLogger = (err) => {
  let errorMessage = err;
  if (err.stack) errorMessage = err.stack;
  console.error(chalk.red.bold(`${errorMessage}`));
  if (err.cause) console.error(chalk.red.bold('> Cause:'), chalk.red.bold(err.cause));
}

const logger = { 
  log: infoLogger,
  error: errorLogger,
}

export default logger;