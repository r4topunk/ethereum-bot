import dotenv from 'dotenv';
import { AlchemyProvider, Contract, Wallet, parseEther } from "ethers";
import { jsonAbi } from "./erc20-abi.js";

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new AlchemyProvider('base', ALCHEMY_API_KEY);
const contractAddress = '0x5F123E1c5DFE89408EF954FBFc26aB2050a18cF3';

const privateKey = process.env.WALLET_PRIVATE_KEY;
const wallet = new Wallet(privateKey, provider);

const contract = new Contract(contractAddress, jsonAbi, wallet);
// const iface = new Interface(jsonAbi);
console.log(contract.buy)

async function executeBuy() {
  if (typeof contract.buy === 'function') {
    try {
      const txParams = {
        value: parseEther('0.00001')
      };

      const txResponse = await contract.buy(
        wallet.address, // recipient
        wallet.address, // refundRecipient
        wallet.address, // orderReferrer
        "r4to rules", // comment
        0, // expectedMarketType
        parseEther('0.00001'), // minOrderSize
        0, // sqrtPriceLimitX96
        txParams
      );
      console.log(`Transaction sent: ${txResponse.hash}`);

      const receipt = await txResponse.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
      console.error(`Error sending transaction: ${error}`);
    }
  } else {
    console.error(`Error: 'buy' method not found on contract`);
  }
}

executeBuy();
