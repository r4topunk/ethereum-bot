import { AlchemyProvider, Wallet, ethers, formatEther, id, parseEther, Contract } from "ethers";
import chalk from 'chalk';
import dotenv from 'dotenv';
import { jsonAbi } from "./erc20-abi.js";
import { executeBuy } from "./executeBuy.js"; // Import the executeBuy function

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new AlchemyProvider('base', ALCHEMY_API_KEY);
const contractAddress = '0x997020E5F59cCB79C74D527Be492Cc610CB9fA2B';

const privateKey = process.env.WALLET_PRIVATE_KEY;
const wallet = new Wallet(privateKey, provider);

const contract = new Contract(contractAddress, jsonAbi, wallet);

const MIN_ETH_VALUE = parseEther('0.1');
const BUY_VALUE = parseEther('0.000333');

provider.on('block', async (blockNumber) => {
  // console.log(chalk.cyan(`[${blockNumber}] New block detected`));
  const block = await provider.getBlock(blockNumber, true);

  for (const tx of block.prefetchedTransactions) {
    if (tx.to === contractAddress) {
      console.log(chalk.yellow(`[${blockNumber}] Transaction to contract detected: ${tx.hash}`));

      

      const txAmount = tx.value;
      const formattedAmount = formatEther(txAmount);
      
      if (txAmount === 0) {
        console.log(chalk.red(`[${blockNumber}] Transaction amount: ${formattedAmount} ETH`));
        continue;
      }
      
      if (txAmount > MIN_ETH_VALUE) {
        console.log(chalk.green(`[${blockNumber}] Transaction amount: ${formattedAmount} ETH`));
        
        const receipt = await provider.getTransactionReceipt(tx.hash);
        const transferEvent = receipt.logs.find(log => log.topics[0] === id("Transfer(address,address,uint256)"));
        if (transferEvent) {
          console.log(chalk.yellow(`[${blockNumber}] Transaction has a transfer action: ${tx.hash}`));
          const tokenAddress = transferEvent.address;
          console.log(chalk.green(`[${blockNumber}] Buy the token ${tokenAddress}`));
          const tokenContract = new Contract(tokenAddress, jsonAbi, wallet);
          try {
            await executeBuy(tokenContract, BUY_VALUE); // Pass the token contract and valueToBuy as parameters
          } catch (error) {
            console.error(`[${blockNumber}] Error executing buy: ${error}`);
          }
        }
      } else {
        console.log(chalk.red(`[${blockNumber}] Transaction amount is less than 0.01 ETH, skipping transaction.`));
      }
    }
  }
});
