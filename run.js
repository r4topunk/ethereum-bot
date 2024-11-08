import { ethers, parseEther } from 'ethers';
import { executeBuy, getBalanceAndSellAll, getTokenWorthInEth } from './executeBuy.js';
import dotenv from 'dotenv';
import { jsonAbi } from './erc20-abi.js';
import { wallet } from './wallet.js';
import { BUY_VALUE } from './constants.js';

dotenv.config();

// 0xa23d4a9de7650b7df70f98aae03807fae5df618b

// const contractAddress = '0xA23D4A9De7650B7Df70F98aAe03807fae5dF618B';
const contractAddress = '0xD5D5c9763547B7092e7A27FF821D6E0d8b6231D7';
const contract = new ethers.Contract(contractAddress, jsonAbi, wallet);

(async () => {
  // await getBalanceAndSellAll(contract);
  // await executeBuy(contract, parseEther('0.002'));
  await getTokenWorthInEth(contract);
})();