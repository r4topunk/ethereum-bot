import sqlite3 from 'sqlite3';
import { logColor } from '/Users/gustavokuhl/Script/Blockchain/bot/utils.js';
import chalk from 'chalk';

export async function openDb() {
  return new sqlite3.Database("database.db");
}

export async function createTable() {
  const db = await openDb();
  // await execute(db, `DROP TABLE IF EXISTS transactions`);
  await execute(db, `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blockNumber INTEGER,
      txAmount TEXT,
      txHash TEXT,
      tokenAddress TEXT
    )
  `);
}

export async function deleteAllTransactions() {
  const db = await openDb();
  await execute(db, `DELETE FROM transactions`);
}

export const execute = async (db, sql, params = []) => {
  if (params && params.length > 0) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};