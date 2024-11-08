import { Contract, formatEther, id } from "ethers";
import { BUY_VALUE, CONTRACT_ADDRESS, MIN_ETH_VALUE, SHOULD_BUY } from "./constants.js";
import { jsonAbi } from "./erc20-abi.js";
import { executeBuy } from "./executeBuy.js";
import { provider } from "./provider.js";
import { logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";

provider.on("block", async (blockNumber) => {
  // logWithTimestamp(`[${blockNumber}] New block detected`, chalk.cyan);
  const block = await provider.getBlock(blockNumber, true);

  for (const tx of block.prefetchedTransactions) {
    if (tx.to === CONTRACT_ADDRESS) {
      logWithTimestamp(
        `[${blockNumber}] Transaction to contract detected: ${tx.hash}`,
        chalk.yellow
      );

      const txAmount = tx.value;
      const formattedAmount = formatEther(txAmount);

      if (txAmount < MIN_ETH_VALUE) {
        logWithTimestamp(
          `[${blockNumber}] Transaction amount: ${formattedAmount} ETH`,
          chalk.red
        );
        continue;
      }

      logWithTimestamp(
        `[${blockNumber}] Transaction amount: ${formattedAmount} ETH`,
        chalk.green
      );

      const receipt = await provider.getTransactionReceipt(tx.hash);
      const transferEvent = receipt.logs.find(
        (log) => log.topics[0] === id("Transfer(address,address,uint256)")
      );
      if (transferEvent) {
        logWithTimestamp(
          `[${blockNumber}] Transaction has a transfer action: ${tx.hash}`,
          chalk.yellow
        );
        const tokenAddress = transferEvent.address;
        logWithTimestamp(
          `[${blockNumber}] Token address ${tokenAddress}`,
          chalk.green
        );
        logWithTimestamp(
          `[${blockNumber}] https://basescan.org/address/${tokenAddress}`,
          chalk.green
        );
        logWithTimestamp(
          `[${blockNumber}] https://wow.xyz/${tokenAddress}`,
          chalk.green
        );
        if (SHOULD_BUY) {
          const tokenContract = new Contract(tokenAddress, jsonAbi, wallet);
          try {
            await executeBuy(tokenContract, BUY_VALUE);
          } catch (error) {
            logWithTimestamp(
              `[${blockNumber}] Error executing buy: ${error}`,
              chalk.red
            );
          }
        }
      }
    }
  }
});
