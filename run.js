import chalk from "chalk";
import dotenv from "dotenv";
import { ethers } from "ethers";
import yargs from "yargs";
import { BUY_VALUE, DEFAULT_CONTRACTS } from "./constants.js";
import { jsonAbi } from "./erc20-abi.js";
import { lineBreak, logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import { getTotalSpentForContracts } from "./spending.js";
import { executeBuy, executeSell, getBalanceAndSellAll } from "./trading.js";
import { getTokenWorthInEth } from "./tokenInfo.js";

const argv = yargs(process.argv)
  .option("operation", {
    describe: "The operation to perform",
    alias: "o",
    choices: ["buy", "sell", "sell-all", "info"],
    default: "info",
  })
  .option("contractAddress", {
    alias: "c",
    describe: "The contract address",
    type: "string",
    demandOption: false,
  })
  .option("allContracts", {
    alias: "a",
    description: "Perform the operation on all contracts",
    type: "boolean",
    demandOption: false,
  })
  .help()
  .alias("help", "h").argv;

dotenv.config();

const contracts = argv?.allContracts
  ? DEFAULT_CONTRACTS
  : argv?.contractAddress
  ? [argv?.contractAddress]
  : [];

const operation = argv?.operation;

(async () => {
  if (contracts.length === 0) {
    console.log("No contracts provided");
    return;
  }

  const totalSpent = await getTotalSpentForContracts(contracts);
  for (const contractAddress of contracts) {
    lineBreak();
    const contract = new ethers.Contract(contractAddress, jsonAbi, wallet);

    if (operation === "buy") {
      await executeBuy(contract, BUY_VALUE);
    } else if (operation === "sell") {
      const { balance } = await getTokenWorthInEth(contract, totalSpent);
      await executeSell(contract, balance);
    } else if (operation === "sell-all") {
      if (contracts.length > 1) {
        logWithTimestamp(
          "Cannot sell all tokens for multiple contracts",
          chalk.red
        );
        return;
      }
      await getBalanceAndSellAll(contract);
    } else if (operation === "info") {
      await getTokenWorthInEth(contract, totalSpent);
      // await getTokenPriceUniswap(contractAddress);
    }
  }

  lineBreak();
})();
