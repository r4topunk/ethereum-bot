import chalk from 'chalk';
import { LOG_FILE_PATH } from './constants.js';
import { appendFileSync } from 'fs';

export function logWithTimestamp(message, color = chalk.white) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const logMessage = `[${now}] ${message}`;
  // appendFileSync(LOG_FILE_PATH, logMessage + '\n');
  console.log(color(logMessage));
}