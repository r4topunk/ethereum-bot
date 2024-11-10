import dotenv from 'dotenv';
import { parseEther } from "ethers";

dotenv.config();


export const SHOULD_BUY = true;
export const BUY_VALUE = parseEther('0.00012');
export const MIN_ETH_VALUE = parseEther('0.5');


export const FILE_LOG_ON = true;
export const LOG_FILE_PATH = "log.txt";
export const HIDE_ZERO_DEPLOY = true;


export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const CONTRACT_ADDRESS = '0x997020E5F59cCB79C74D527Be492Cc610CB9fA2B';

export const DEFAULT_CONTRACTS = [
  "0xD4757D50edE41a16a8aE688B20088D6c7d0f0Fbc", // Bald
  "0xD5D5c9763547B7092e7A27FF821D6E0d8b6231D7", // smoke
  "0xA23D4A9De7650B7Df70F98aAe03807fae5dF618B", // BoredWizardoKat
  // "0x073cd37B225B79D19278fff9172443DAA2B6df5c", // We Ain't Gonna Make It
  // "0x61C5D31B3aC2F5870ac03fF67898dC2251B2AAe3", // 666
  // "0x57D3b686c6e70d99F3dDA7d1B38ac61E3bF9d926", // CEO WEDDING
  // "0x7eB07347a26d8816f6Fa8C6251356Ad3bdaC7d42", // BASED
  // "0xB2e63BD6cBF78860976B8fA8e1C8f42F8368d568", // Frogmusism
  // "0x62d30681b6816aAf0281b8999591Ac4406DB4251", // The Goat
];