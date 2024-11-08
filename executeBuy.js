import dotenv from 'dotenv';
import { AlchemyProvider, Contract, Wallet, parseEther } from "ethers";
import { jsonAbi } from "./erc20-abi.js";
import chalk from 'chalk';

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new AlchemyProvider('base', ALCHEMY_API_KEY);
const contractAddress = '0xd5d5c9763547b7092e7a27ff821d6e0d8b6231d7';

const privateKey = process.env.WALLET_PRIVATE_KEY;
const wallet = new Wallet(privateKey, provider);

const contract = new Contract(contractAddress, jsonAbi, wallet);

export async function executeBuy(contract, valueToBuy) { // Receive contract and valueToBuy as parameters
  if (typeof contract.buy === 'function') {
    try {
      const txParams = {
        value: valueToBuy
      };

      const txResponse = await contract.buy(
        wallet.address, // recipient
        wallet.address, // refundRecipient
        wallet.address, // orderReferrer
        "r4to rules", // comment
        0, // expectedMarketType
        valueToBuy, // minOrderSize
        0, // sqrtPriceLimitX96
        txParams
      );
      console.log(chalk.green(`Transaction sent: ${txResponse.hash}`));

      const receipt = await txResponse.wait();
      console.log(chalk.green(`Transaction confirmed in block: ${receipt.blockNumber}`));
    } catch (error) {
      console.error(`Error sending transaction: ${error}`);
    }
  } else {
    console.error(`Error: 'buy' method not found on contract`);
  }
}

// executeBuy(contract); // Pass the contract as an argument
