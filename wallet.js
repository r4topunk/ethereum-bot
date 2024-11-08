import { Wallet } from "ethers";
import { provider } from "./provider.js";
import { WALLET_PRIVATE_KEY } from "./constants.js";

export const wallet = new Wallet(WALLET_PRIVATE_KEY, provider);