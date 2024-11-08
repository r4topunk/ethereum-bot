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

const argv = yargs(process.argv)
  .option("contractAddress", {
    alias: "c",
    description: "The contract address",
    type: "string",
    demandOption: false,
  })
  .help()
  .alias("help", "h").argv;

dotenv.config();

const contracts = argv?.contractAddress
  ? [argv?.contractAddress]
  : [
      "0x073cd37B225B79D19278fff9172443DAA2B6df5c",
      "0x61C5D31B3aC2F5870ac03fF67898dC2251B2AAe3",
      "0x57D3b686c6e70d99F3dDA7d1B38ac61E3bF9d926",
      "0x7eB07347a26d8816f6Fa8C6251356Ad3bdaC7d42",
      "0xD4757D50edE41a16a8aE688B20088D6c7d0f0Fbc",
      "0xB2e63BD6cBF78860976B8fA8e1C8f42F8368d568",
      "0xD5D5c9763547B7092e7A27FF821D6E0d8b6231D7",
    ];

(async () => {
  // await getBalanceAndSellAll(contract);
  // await executeBuy(contract, parseEther('0.002'));
  // await executeSell(contract, parseEther('0.002'));
  const totalSpent = await getTotalSpentForContracts(contracts);
  for (const contractAddress of contracts) {
    console.log();
    const contract = new ethers.Contract(contractAddress, jsonAbi, wallet);
    const { balance } = await getTokenWorthInEth(contract, totalSpent);
    // const sellReceipt = await executeSell(contract, balance);
    // console.log(`Sold ${contractAddress} for ${balance} ETH`);
    // console.log(`Receipt: ${sellReceipt}`);
  }

  console.log();
})();