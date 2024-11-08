
import { logWithTimestamp } from "./utils.js";
import { provider } from "./provider.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import { id, zeroPadValue, toBigInt } from "ethers";

export async function getTotalSpent(contractAddress) {
  try {
    const filter = {
      fromBlock: 22119142,
      toBlock: "latest",
      topics: [
        id("Transfer(address,address,uint256)"),
        null,
        zeroPadValue(wallet.address, 32),
      ],
    };

    const logs = await provider.getLogs(filter);
    let totalSpent = toBigInt(0);

    // Collect all transaction hashes
    const transactionHashes = logs.map((log) => log.transactionHash);

    // Fetch all transactions in parallel
    const transactions = await Promise.all(
      transactionHashes.map((hash) => provider.getTransaction(hash))
    );

    for (const tx of transactions) {
      if (tx.to === contractAddress) {
        totalSpent += toBigInt(tx.value);
      }
    }

    return totalSpent; // return totalSpent in Wei
  } catch (error) {
    logWithTimestamp(`Error fetching total spent: ${error}`, chalk.red);
    return 0;
  }
}

export async function getTotalSpentForContracts(contractAddresses) {
  try {
    const filter = {
      fromBlock: 22119142,
      toBlock: "latest",
      topics: [
        id("Transfer(address,address,uint256)"),
        null,
        zeroPadValue(wallet.address, 32),
      ],
    };

    const logs = await provider.getLogs(filter);

    // Initialize totalSpentMap with zero for each address
    const totalSpentMap = {};
    for (const address of contractAddresses) {
      totalSpentMap[address] = toBigInt(0);
    }

    // Collect all unique transaction hashes
    const transactionHashes = [
      ...new Set(logs.map((log) => log.transactionHash)),
    ];

    // Fetch all transactions in parallel
    const transactions = await Promise.all(
      transactionHashes.map((hash) => provider.getTransaction(hash))
    );

    for (const tx of transactions) {
      if (contractAddresses.includes(tx.to)) {
        totalSpentMap[tx.to] += toBigInt(tx.value);
      }
    }

    return totalSpentMap;
  } catch (error) {
    logWithTimestamp(`Error fetching total spent: ${error}`, chalk.red);
    return {};
  }
}