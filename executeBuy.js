import chalk from "chalk";
import dotenv from "dotenv";
import { formatEther, formatUnits, id, toBigInt, zeroPadValue } from "ethers";
import terminalLink from "terminal-link";
import { provider } from "./provider.js";
import { getEthZeros, logColor } from "./utils.js";
import { wallet } from "./wallet.js";
// ...existing imports...

import { executeBuy, executeSell, getBalanceAndSellAll } from "./trading.js";
import { getTokenWorthInEth, getTokenPrice, getTokenPriceUniswap } from "./tokenInfo.js";
import { getTotalSpent, getTotalSpentForContracts } from "./spending.js";

// ...existing code...
// Functions have been moved to their respective files.