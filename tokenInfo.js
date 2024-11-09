
import { logWithTimestamp, getEthZeros } from "./utils.js";
import { provider } from "./provider.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import { formatEther, formatUnits, id, Interface, toBigInt } from "ethers";
import { UNISWAP_V3_POOL_ABI } from "./uniswap-v3-abi.js";
import terminalLink from "terminal-link";

export async function getTokenWorthInEth(contract, totalSpentMap) {
  try {
    const tokenName = await contract.name();
    const contractAddress = await contract.getAddress();

    const baseLink = terminalLink(
      "Base",
      `https://basescan.org/address/${contractAddress}`
    );
    const wowLink = terminalLink("Wow", `https://wow.xyz/${contractAddress}`);
    const dexScreen = terminalLink(
      "DexScreen",
      `https://dexscreener.com/base/${contractAddress}`
    );

    const links = terminalLink.isSupported
      ? `${tokenName} => ${baseLink} | ${wowLink} | ${dexScreen}`
      : `${tokenName}\n` + chalk.blue(`${baseLink}\n${wowLink}\n${dexScreen}`);

    logWithTimestamp(links, chalk.magenta, false);
    logWithTimestamp(`Address ${contractAddress}`, chalk.black, false);

    const balance = await contract.balanceOf(wallet.address);
    logWithTimestamp(`Balance ${Number(formatUnits(balance, 18)).toFixed("8")}`, chalk.black, false);

    // 0 = BONDING_CURVE, 1 = UNISWAP_POOL
    const marketType = await contract.marketType();
    logWithTimestamp(
      `Type    ${marketType === 0n ? "BONDING_CURVE" : "UNISWAP_POOL"}`,
      chalk.black,
      false
    );

    const filter = {
      fromBlock: 22119142,
      toBlock: "latest",
      address: contractAddress,
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
    const lastTransactionDate = new Date(block.timestamp * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    if (marketType === 0n) {
      // Decode the transaction data to get the function name
      const iface = new Interface(contract.interface.fragments);
      const parsedTransaction = iface.parseTransaction({ data: lastTransaction.data });
      // console.log(formatUnits(parsedTransaction.args[0], 18));
      const functionName = parsedTransaction.name;
      logWithTimestamp(`Lastx   [${functionName.toUpperCase()}] ${lastTransactionDate}`, chalk.black, false);
    }

    const totalSpentWei = totalSpentMap[contractAddress] || toBigInt(0);
    let spentNumOfZeros = getEthZeros(formatEther(totalSpentWei));
    logWithTimestamp(
      `Spent   [0x${spentNumOfZeros}] ${Number(formatEther(totalSpentWei)).toFixed(8)} ETH`,
      chalk.black,
      false
    );

    if (balance > 0) {
      const poolAddress = await contract.poolAddress();
      let ethWorthInWei;

      if (marketType === 0n) {
        ethWorthInWei = await contract.getTokenSellQuote(balance);
      } else {
        const tokenPriceInWei = await getTokenPriceUniswap(poolAddress);
        ethWorthInWei = tokenPriceInWei * balance / BigInt(10 ** 18);
      }

      const ethWorth = formatEther(ethWorthInWei);
      const balanceNumOfZeros = getEthZeros(ethWorth);

      logWithTimestamp(
        `Worth   [0x${balanceNumOfZeros}] ${Number(ethWorth).toFixed(8)} ETH`,
        chalk.black,
        false
      );

      const differenceInWei = ethWorthInWei - totalSpentWei;
      const percentageDifference = (differenceInWei * 100n) / totalSpentWei;
      const percentage = Number(percentageDifference);
      logWithTimestamp(
        `Diff    ${percentage}%`,
        percentage > 0 ? chalk.green : chalk.red,
        false
      );

      return { ethWorth, percentage, balance };
    } else {
      logWithTimestamp(`No tokens to calculate worth`, chalk.yellow, false);
      return 0;
    }
  } catch (error) {
    logWithTimestamp(
      `Error calculating token worth: ${error}`,
      chalk.red,
      false
    );
    return 0;
  }
}

export async function getTokenPrice(contract) {
  const ethWorthInWei = await contract.getTokenSellQuote(balance);
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