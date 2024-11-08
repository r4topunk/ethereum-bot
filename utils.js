import chalk from 'chalk';

export function logWithTimestamp(message, color = chalk.white) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(color(`[${now}] ${message}`));
}