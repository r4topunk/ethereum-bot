import { logWithTimestamp, getEthZeros } from "./utils.js";
import { provider } from "./provider.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import { formatEther, formatUnits, id, Interface, toBigInt } from "ethers";
import { UNISWAP_V3_POOL_ABI } from "./uniswap-v3-abi.js";
import terminalLink from "terminal-link";

export async function getTokenWorthInEth(tokenContract, totalSpentMap) {
  try {
    const tokenName = await tokenContract.name();
    const tokenAddress = await tokenContract.getAddress();

    const links = generateTokenLinks(tokenName, tokenAddress);
    logWithTimestamp(links, chalk.magenta, false);
    logWithTimestamp(`Address ${tokenAddress}`, chalk.black, false);

    const tokenBalance = await getTokenBalance(tokenContract);
    logWithTimestamp(`Balance ${formatTokenBalance(tokenBalance)}`, chalk.black, false);

    const marketType = await getMarketType(tokenContract);
    logWithTimestamp(`Type    ${marketType}`, chalk.black, false);

    const lastTransactionDate = await getLastTransactionDate(tokenAddress);
    if (marketType === "BONDING_CURVE") {
      const lastFunctionName = await getLastTransactionFunctionName(tokenContract, tokenAddress);
      logWithTimestamp(`Lastx   [${lastFunctionName}] ${lastTransactionDate}`, chalk.black, false);
    }

    const totalSpentWei = totalSpentMap[tokenAddress] || toBigInt(0);
    const formattedSpent = formatEthValue(totalSpentWei);
    logWithTimestamp(`Spent   ${formattedSpent}`, chalk.black, false);

    if (tokenBalance > 0) {
      const tokenWorthInWei = await calculateTokenWorth(tokenContract, tokenBalance, marketType);
      const formattedWorth = formatEthValue(tokenWorthInWei);
      logWithTimestamp(`Worth   ${formattedWorth}`, chalk.black, false);

      const percentageDifference = calculateDifferencePercentage(tokenWorthInWei, totalSpentWei);
      logWithTimestamp(
        `Diff    ${percentageDifference}%`,
        percentageDifference > 0 ? chalk.green : chalk.red,
        false
      );

      return { ethWorth: formatEther(tokenWorthInWei), percentage: percentageDifference, balance: tokenBalance };
    } else {
      logWithTimestamp(`No tokens to calculate worth`, chalk.yellow, false);
      return 0;
    }
  } catch (error) {
    logWithTimestamp(`Error calculating token worth: ${error}`, chalk.red, false);
    return 0;
  }
}

// Helper functions

function generateTokenLinks(tokenName, tokenAddress) {
  const baseLink = terminalLink(
    "Base",
    `https://basescan.org/address/${tokenAddress}`
  );
  const wowLink = terminalLink("Wow", `https://wow.xyz/${tokenAddress}`);
  const dexScreen = terminalLink(
    "DexScreen",
    `https://dexscreener.com/base/${tokenAddress}`
  );

  return terminalLink.isSupported
    ? `${tokenName} => ${baseLink} | ${wowLink} | ${dexScreen}`
    : `${tokenName}\n` + chalk.blue(`${baseLink}\n${wowLink}\n${dexScreen}`);
}

async function getTokenBalance(tokenContract) {
  return await tokenContract.balanceOf(wallet.address);
}

function formatTokenBalance(balance) {
  return Number(formatUnits(balance, 18)).toFixed(8);
}

async function getMarketType(tokenContract) {
  const marketTypeValue = await tokenContract.marketType();
  return marketTypeValue === 0n ? "BONDING_CURVE" : "UNISWAP_POOL";
}

async function getLastTransactionDate(tokenAddress) {
  const filter = {
    fromBlock: 22119142,
    toBlock: "latest",
    address: tokenAddress,
    topics: [
      id("Transfer(address,address,uint256)"),
      null,
      null,
    ],
  };

  const logs = await provider.getLogs(filter);
  const lastTransactionLog = logs[logs.length - 1];
  const lastTransaction = await provider.getTransaction(lastTransactionLog.transactionHash);
  const block = await provider.getBlock(lastTransaction.blockNumber);
  return new Date(block.timestamp * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function getLastTransactionFunctionName(tokenContract, tokenAddress) {
  const filter = {
    fromBlock: 22119142,
    toBlock: "latest",
    address: tokenAddress,
    topics: [
      id("Transfer(address,address,uint256)"),
      null,
      null,
    ],
  };

  const logs = await provider.getLogs(filter);
  const lastTransactionLog = logs[logs.length - 1];
  const lastTransaction = await provider.getTransaction(lastTransactionLog.transactionHash);

  const iface = new Interface(tokenContract.interface.fragments);
  const parsedTransaction = iface.parseTransaction({ data: lastTransaction.data });
  return parsedTransaction.name.toUpperCase();
}

function formatEthValue(valueInWei) {
  const zeros = getEthZeros(formatEther(valueInWei));
  return `[0x${zeros}] ${Number(formatEther(valueInWei)).toFixed(8)} ETH`;
}

async function calculateTokenWorth(tokenContract, tokenBalance, marketType) {
  if (marketType === "BONDING_CURVE") {
    return await tokenContract.getTokenSellQuote(tokenBalance);
  } else {
    const poolAddress = await tokenContract.poolAddress();
    const tokenPriceInWei = await getTokenPriceUniswap(poolAddress);
    return (tokenPriceInWei * toBigInt(tokenBalance)) / BigInt(1e18);
  }
}

function calculateDifferencePercentage(tokenWorthInWei, totalSpentWei) {
  const differenceInWei = tokenWorthInWei - totalSpentWei;
  const percentageDifference = (differenceInWei * 100n) / totalSpentWei;
  return Number(percentageDifference);
}

export async function getTokenPrice(tokenContract) {
  const ethWorthInWei = await tokenContract.getTokenSellQuote(balance);
  const ethWorth = formatEther(ethWorthInWei);
  return ethWorth
}

export async function getTokenPriceUniswap(uniswapPoolAddress) {
  const uniswapPoolContract = new Contract(
    // "0xBd74Fbaf6E9d2B08EB938981EFF601BD61CFAE8E",
    uniswapPoolAddress,
    UNISWAP_V3_POOL_ABI,
    provider
  );

  try {
    // Fetch the sqrtPriceX96 from the pool
    const slot0 = await uniswapPoolContract.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;

    // Calculate token price in ETH
    const priceInWei = sqrtPriceX96 ** 2n / 2n ** 192n;
    return priceInWei
  } catch (error) {
    console.error("Error fetching token price from Uniswap pool:", error);
  }
}