import { AlchemyProvider, Wallet, ethers, formatEther, id, parseEther, Contract } from "ethers";
import chalk from 'chalk';
import dotenv from 'dotenv';
import { jsonAbi } from "./erc20-abi.js";

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new AlchemyProvider('base', ALCHEMY_API_KEY);
const contractAddress = '0x997020E5F59cCB79C74D527Be492Cc610CB9fA2B';

const privateKey = process.env.WALLET_PRIVATE_KEY;
const wallet = new Wallet(privateKey, provider);

const contract = new Contract(contractAddress, jsonAbi, wallet);

provider.on('block', async (blockNumber) => {
  console.log(chalk.cyan(`[${blockNumber}] New block detected`));
  const block = await provider.getBlock(blockNumber, true);

  for (const tx of block.prefetchedTransactions) {
    if (tx.to === contractAddress) {
      console.log(chalk.yellow(`[${blockNumber}] Transaction to contract detected: ${tx.hash}`));

      const receipt = await provider.getTransactionReceipt(tx.hash);
      const transferEvent = receipt.logs.find(log => log.topics[0] === id("Transfer(address,address,uint256)"));
      if (transferEvent) {
        console.log(chalk.yellow(`[${blockNumber}] Transaction has a transfer action: ${tx.hash}`));
        console.log(chalk.yellow(`[${blockNumber}] Transfer event: ${JSON.stringify(transferEvent)}`));
      }

      const txAmount = tx.value;
      const formattedAmount = formatEther(txAmount);
      console.log(chalk.magenta(`[${blockNumber}] Transaction amount: ${formattedAmount} ETH`));

      if (txAmount === 0) {
        console.log(chalk.red(`[${blockNumber}] Transaction amount is 0.0 ETH, skipping transaction.`));
        continue;
      }

      if (txAmount > parseEther('0.01')) {
        console.log(chalk.green(`[${blockNumber}] Transaction amount is greater than 0.01 ETH, proceeding with transaction.`));
        if (transferEvent) {
          console.log(chalk.green(`[${blockNumber}] Buy the token ${transferEvent.address}`));
        }

        if (typeof contract.buy === 'function') {
          try {
            const txParams = {
              value: parseEther('0.00001')
            };
            const gasEstimate = await contract.estimateGas.buy(
              wallet.address, // recipient
              wallet.address, // refundRecipient
              wallet.address, // orderReferrer
              "", // comment
              0, // expectedMarketType
              parseEther('0.00001'), // minOrderSize
               0 // sqrtPriceLimitX96
            );
            txParams.gasLimit = gasEstimate;

            const txResponse = await contract.buy(
              wallet.address, // recipient
              wallet.address, // refundRecipient
              wallet.address, // orderReferrer
              "", // comment
              0, // expectedMarketType
              parseEther('0.00001'), // minOrderSize
              0, // sqrtPriceLimitX96
              txParams
            );
            console.log(`[${blockNumber}] Transaction sent: ${txResponse.hash}`);

            const receipt = await txResponse.wait();
            console.log(`[${blockNumber}] Transaction confirmed in block: ${receipt.blockNumber}`);
            console.log(`[${blockNumber}] Bought tokens: ${receipt}`);
          } catch (error) {
            console.error(`[${blockNumber}] Error sending transaction: ${error}`);
          }
        } else {
          console.error(`[${blockNumber}] Error: 'buy' method not found on contract`);
        }
      } else {
        console.log(chalk.red(`[${blockNumber}] Transaction amount is less than 0.01 ETH, skipping transaction.`));
      }
    }
  }
});
