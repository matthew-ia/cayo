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
  // TODO: good reason to write a new logger that is
  // globally initialized and passed in a runtime object, 
  // so this could have access to _cayo.config options
  // Only really useful for dev
  // if (err.stack) errorMessage = err.stack;
  console.error(chalk.red.bold(err));
  console.log(err);
  
  if (err.cause && !err.cause.cause) {
    console.error(`${chalk.red.bold('> Cause:')} ${chalk.red.bold(err.cause)}`);
    // console.error(err.cause.stack);
  } else {
    handleCause(err);
  }
}

const handleCause = (err) => {
  let prefix = chalk.red.bold('> Cause:');
  if (err.cause) {
    console.error(`${prefix} ${chalk.red.bold(err.cause)}`);
    // console.error(err.cause.stack);
    handleCause(err.cause);
  } else {
    // console.error(`${prefix} ${chalk.red.bold(err.stack)}`);
    // console.error(err.stack);
  }
}

const logger = { 
  log: infoLogger,
  error: errorLogger,
}

export default logger;