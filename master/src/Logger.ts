import bunyan from 'bunyan';
import { LoggingBunyan } from '@google-cloud/logging-bunyan';

function makeBunyanLogger() {
  // Creates a Bunyan Stack Driver Logging client
  const loggingBunyan = new LoggingBunyan();

  // Create a Bunyan logger that streams to Stack Driver Logging
  // Logs will be written to: "projects/collaborative-teaching/logs/bunyan_log"
  return bunyan.createLogger({
    // The JSON payload of the log as it appears in Stack Driver Logging
    name: process.env.NAME as string,
    streams: [{ stream: process.stdout, level: 'debug' }, loggingBunyan.stream('debug')],
  });
}

const logger = process.env.NODE_ENV === 'production' ? makeBunyanLogger() : console;

export const LOGGER = logger;
