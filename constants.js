import dotenv from 'dotenv';
import { parseEther } from "ethers";

dotenv.config();


export const SHOULD_BUY = true;
export const BUY_VALUE = parseEther('0.00012');
export const MIN_ETH_VALUE = parseEther('0.5');


export const LOG_FILE_PATH = "log.txt";


export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const CONTRACT_ADDRESS = '0x997020E5F59cCB79C74D527Be492Cc610CB9fA2B';