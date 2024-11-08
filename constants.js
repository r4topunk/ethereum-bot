import dotenv from 'dotenv';
import { parseEther } from "ethers";

dotenv.config();

export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const CONTRACT_ADDRESS = '0x997020E5F59cCB79C74D527Be492Cc610CB9fA2B';
export const MIN_ETH_VALUE = parseEther('0.1');
export const BUY_VALUE = parseEther('0.000333');