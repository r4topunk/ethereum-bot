import chalk from 'chalk';
import { LOG_FILE_PATH } from './constants.js';
import { appendFileSync } from 'fs';

export function logWithTimestamp(message, color = chalk.white, logDate = true) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const logMessage = logDate ? `[${now}] ${message}` : message;
  // appendFileSync(LOG_FILE_PATH, logMessage + '\n');
  console.log(color(logMessage));
}