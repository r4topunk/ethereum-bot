import { Contract, formatEther, id } from "ethers";
import { BUY_VALUE, CONTRACT_ADDRESS, MIN_ETH_VALUE, SHOULD_BUY } from "./constants.js";
import { jsonAbi } from "./erc20-abi.js";
import { executeBuy } from "./executeBuy.js";
import { provider } from "./provider.js";
import { logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import terminalLink from "terminal-link";

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

      let logMessage = `[${new Date().toLocaleString()}] [${blockNumber}] [${Number(formattedAmount).toFixed(8)} ETH] [${tx.hash}]`;

      if (txAmount < MIN_ETH_VALUE) {
        logWithTimestamp(logMessage, chalk.red);
        continue;
      }

      const receipt = await provider.getTransactionReceipt(tx.hash);
      const transferEvent = receipt.logs.find(
        (log) => log.topics[0] === id("Transfer(address,address,uint256)")
      );
      if (transferEvent) {
        logWithTimestamp(logMessage, chalk.green);
        const tokenAddress = transferEvent.address;
        if (SHOULD_BUY) {
          const tokenContract = new Contract(tokenAddress, jsonAbi, wallet);
          try {
            await executeBuy(tokenContract, BUY_VALUE);
          } catch (error) {
            logWithTimestamp(`Error executing buy: ${error}\n`, chalk.yellow);
          }
        }
      } else {
        logWithTimestamp(logMessage, chalk.green);
      }
    }
  }
});
