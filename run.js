import { ethers } from 'ethers';
import { getBalanceAndSellAll } from './executeBuy.js';
import dotenv from 'dotenv';
import { jsonAbi } from './erc20-abi.js';
import { wallet } from './wallet.js';

dotenv.config();

const contractAddress = '0x61C5D31B3aC2F5870ac03fF67898dC2251B2AAe3';
const contract = new ethers.Contract(contractAddress, jsonAbi, wallet);

(async () => {
  await getBalanceAndSellAll(contract);
})();