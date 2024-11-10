import { Contract, formatEther, id } from "ethers";
import {
  BUY_VALUE,
  CONTRACT_ADDRESS,
  HIDE_ZERO_DEPLOY,
  MIN_ETH_VALUE,
  SHOULD_BUY,
} from "./constants.js";
import { jsonAbi } from "./erc20-abi.js";
// import { executeBuy } from "./executeBuy.js";
import { provider } from "./provider.js";
import { logColor } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import terminalLink from "terminal-link";
import { executeBuy } from "./trading.js";
import { openDb, createTable, execute } from "./database.js";

// Initialize the database and create the table
(async () => {
  await createTable();
})();

provider.on("block", async (blockNumber) => {
  // logWithTimestamp(`[${blockNumber}] New block detected`, chalk.cyan);
  const block = await provider.getBlock(blockNumber, true);

  for (const tx of block.prefetchedTransactions) {
    if (tx.to === CONTRACT_ADDRESS) {
      const baseLink = terminalLink(
        "New transaction detected",
        `https://basescan.org/tx/${tx.hash}`
      );

      const txAmount = tx.value;
      const formattedAmount = formatEther(txAmount);

      let logMessage = `[${blockNumber}] [${Number(formattedAmount).toFixed(
        8
      )} ETH] [${tx.hash}]`;

      if (txAmount !== 0n) {
        const db = await openDb();
        await execute(db, 
          `INSERT INTO transactions (blockNumber, txAmount, txHash) VALUES (?, ?, ?)`,
          [blockNumber,
          formattedAmount,
          tx.hash]
        );
      }

      if (txAmount < MIN_ETH_VALUE) {
        if (txAmount !== 0n) logColor(logMessage, chalk.red, true);
        continue;
      }

      const receipt = await provider.getTransactionReceipt(tx.hash);
      const transferEvent = receipt.logs.find(
        (log) => log.topics[0] === id("Transfer(address,address,uint256)")
      );

      if (transferEvent) {
        logColor(logMessage, chalk.green, true);
        const tokenAddress = transferEvent.address;
        if (SHOULD_BUY) {
          const tokenContract = new Contract(tokenAddress, jsonAbi, wallet);
          try {
            await executeBuy(tokenContract, BUY_VALUE);
          } catch (error) {
            logColor(`Error executing buy: ${error}\n`, chalk.yellow, true);
          }
        }
      } else {
        logColor(logMessage, chalk.green, true);
      }
    }
  }
});
