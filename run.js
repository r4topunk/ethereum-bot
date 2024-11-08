import { ethers, parseEther } from "ethers";
import {
  executeBuy,
  executeSell,
  getBalanceAndSellAll,
  getTokenWorthInEth,
  getTotalSpent,
  getTotalSpentForContracts,
} from "./executeBuy.js";
import dotenv from "dotenv";
import { jsonAbi } from "./erc20-abi.js";
import { wallet } from "./wallet.js";
import yargs from "yargs";
import { BUY_VALUE } from "./constants.js";
import { lineBreak, logWithTimestamp } from "./utils.js";
import chalk from "chalk";
import { formatEther } from "ethers";

const argv = yargs(process.argv)
  .option("operation", {
    alias: "o",
    description: "The operation to perform",
    type: "string",
    demandOption: false,
  })
  .option("contractAddress", {
    alias: "c",
    description: "The contract address",
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
  ? [
      "0x073cd37B225B79D19278fff9172443DAA2B6df5c",
      "0x61C5D31B3aC2F5870ac03fF67898dC2251B2AAe3",
      "0x57D3b686c6e70d99F3dDA7d1B38ac61E3bF9d926",
      "0x7eB07347a26d8816f6Fa8C6251356Ad3bdaC7d42",
      "0xD4757D50edE41a16a8aE688B20088D6c7d0f0Fbc",
      "0xB2e63BD6cBF78860976B8fA8e1C8f42F8368d568",
      "0xD5D5c9763547B7092e7A27FF821D6E0d8b6231D7",
      "0xA23D4A9De7650B7Df70F98aAe03807fae5dF618B",
      "0x62d30681b6816aAf0281b8999591Ac4406DB4251"
    ]
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
    const contract = new ethers.Contract(contractAddress, jsonAbi, wallet);
    
    if (operation === "buy") {
      await executeBuy(contract, BUY_VALUE);
    } else if (operation === "sell") {
      const { balance } = await getTokenWorthInEth(contract, totalSpent);
      await executeSell(contract, balance);
    } else if (operation === "sell-all") {
      if (contracts.length > 1) {
        logWithTimestamp("Cannot sell all tokens for multiple contracts", chalk.red);
        return;
      }
      await getBalanceAndSellAll(contract);
    } else {
      lineBreak();
      await getTokenWorthInEth(contract, totalSpent);
    }
  }
  
  lineBreak();
})();
