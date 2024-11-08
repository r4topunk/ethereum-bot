import chalk from 'chalk';
import { FILE_LOG_ON, LOG_FILE_PATH } from './constants.js';
import { appendFileSync } from 'fs';

export function logWithTimestamp(message, color = chalk.white, logDate = true) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const logMessage = logDate ? `[${now}] ${message}` : message;
  console.log(color(logMessage));

  if (FILE_LOG_ON) appendFileSync(LOG_FILE_PATH, logMessage + '\n');
}

export function getEthZeros(ethWorth) {
  const ethWorthStr = ethWorth.toString();
  let numOfZeros = ethWorthStr.match(/(?<=\.)0+/)[0].length;
  return ethWorth < 0 ? numOfZeros : numOfZeros + 1;
}

export function lineBreak() {
  console.log();
}