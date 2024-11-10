import sqlite3 from 'sqlite3';
import { logColor } from '/Users/gustavokuhl/Script/Blockchain/bot/utils.js';
import chalk from 'chalk';

export async function openDb() {
  return new sqlite3.Database("database.db");
}

export async function createTable() {
  const db = await openDb();
  await execute(db, `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blockNumber INTEGER,
      txAmount TEXT,
      txHash TEXT
    )
  `);
}

export const execute = async (db, sql, params = []) => {
  if (params && params.length > 0) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) {
          logColor(`SQL execution error: ${err}`, chalk.redBright, false);
          reject(err);
        } else {
          logColor(`SQL executed successfully: ${sql}`, chalk.greenBright, false);
          resolve();
        }
      });
    });
  }
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        logColor(`SQL execution error: ${err}`, chalk.redBright, false);
        reject(err);
      } else {
        logColor(`SQL executed successfully: ${sql}`, chalk.greenBright, false);
        resolve();
      }
    });
  });
};