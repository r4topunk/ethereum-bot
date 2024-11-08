import { AlchemyProvider } from "ethers";
import { ALCHEMY_API_KEY } from "./constants.js";

export const provider = new AlchemyProvider('base', ALCHEMY_API_KEY);