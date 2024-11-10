import { Contract, formatEther, id } from "ethers";
import {
  BUY_VALUE,
  CONTRACT_ADDRESS,
  MIN_ETH_VALUE,
  SHOULD_BUY
} from "./constants.js";
import { jsonAbi } from "./erc20-abi.js";
// import { executeBuy } from "./executeBuy.js";
import chalk from "chalk";
import { AbiCoder } from "ethers";
import terminalLink from "terminal-link";
import { createTable, execute, openDb } from "./database.js";
import { provider } from "./provider.js";
import { executeBuy } from "./trading.js";
import { logColor } from "./utils.js";
import { wallet } from "./wallet.js";

// Initialize the database and create the table
(async () => {
  await createTable();
})();

provider.on("block", async (blockNumber) => {
  // logColor(`[${blockNumber}] New block detected`, chalk.cyan);
  const block = await provider.getBlock(blockNumber, true);

  for (const tx of block.prefetchedTransactions) {
    if (tx.to === CONTRACT_ADDRESS) {
      const baseLink = terminalLink(
        "New transaction detected",
        `https://basescan.org/tx/${tx.hash}`
      );

      const txAmount = tx.value;
      const formattedAmount = formatEther(txAmount);

      const receipt = await provider.getTransactionReceipt(tx.hash);
      const transferEvent = receipt.logs.find(
        (log) => log.topics[0] === id("Transfer(address,address,uint256)")
      );
      if (!transferEvent) {
        continue;
      }

      const tokenAddress = transferEvent.address;

      let logMessage = `[${blockNumber}] [${Number(formattedAmount).toFixed(
        8
      )} ETH] [${tokenAddress}]`;

      if (txAmount !== 0n) {
        await insertTransaction(blockNumber, formattedAmount, tx.hash, tokenAddress, "info");
      }

      if (txAmount < MIN_ETH_VALUE) {
        if (txAmount !== 0n) logColor(logMessage, chalk.red, true);
        continue;
      }

      logColor(logMessage, chalk.green, true);

      if (SHOULD_BUY) {
        const tokenContract = new Contract(tokenAddress, jsonAbi, wallet);
        try {
          await executeBuy(tokenContract, BUY_VALUE);
        } catch (error) {
          logColor(`Error executing buy: ${error}\n`, chalk.yellow, true);
        }
      } else {
        logColor(logMessage, chalk.green, true);
      }
    }
  }
});
