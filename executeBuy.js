import chalk from "chalk";
import dotenv from "dotenv";
import { formatEther, formatUnits, id, toBigInt, zeroPadValue } from "ethers";
import terminalLink from "terminal-link";
import { provider } from "./provider.js";
import { getEthZeros, logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import { UNISWAP_V3_POOL_ABI } from "./uniswap-v3-abi.js";
import { Contract } from "ethers";
import { parseUnits } from "ethers";

dotenv.config();

export async function executeBuy(contract, valueToBuy) {
  try {
    const txParams = {
      value: valueToBuy,
    };

    const txResponse = await contract.buy(
      wallet.address, // recipient
      wallet.address, // refundRecipient
      wallet.address, // orderReferrer
      "", // comment
      0, // expectedMarketType
      valueToBuy, // minOrderSize
      0, // sqrtPriceLimitX96
      txParams
    );
    logWithTimestamp(`Transaction sent: ${txResponse.hash}`, chalk.green);

    const receipt = await txResponse.wait();
    logWithTimestamp(
      `Transaction confirmed in block: ${receipt.blockNumber}`,
      chalk.green
    );
    logWithTimestamp(
      `Gas paid: ${receipt.gasUsed * receipt.gasPrice}`,
      chalk.green
    );
  } catch (error) {
    logWithTimestamp(`Error sending transaction: ${error}`, chalk.red);
  }
}

export async function executeSell(contract, tokensToSell) {
  try {
    const txResponse = await contract.sell.estimateGas(
      tokensToSell,
      wallet.address, // recipient
      wallet.address, // orderReferrer
      "", // comment
      0, // expectedMarketType
      tokensToSell, // minPayoutSize
      0 // sqrtPriceLimitX96
    );
    logWithTimestamp(`Transaction sent: ${txResponse.hash}`, chalk.green);

    const receipt = await txResponse.wait();
    logWithTimestamp(
      `Transaction confirmed in block: ${receipt.blockNumber}`,
      chalk.green
    );
    logWithTimestamp(
      `Gas paid: ${receipt.gasUsed * receipt.gasPrice}`,
      chalk.green
    );
  } catch (error) {
    logWithTimestamp(`Error sending transaction: ${error}`, chalk.red);
  }
}

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

    logWithTimestamp(`Lastx   ${lastTransactionDate}`, chalk.black, false);

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

export async function getTotalSpent(contractAddress) {
  try {
    const filter = {
      fromBlock: 22119142,
      toBlock: "latest",
      topics: [
        id("Transfer(address,address,uint256)"),
        null,
        zeroPadValue(wallet.address, 32),
      ],
    };

    const logs = await provider.getLogs(filter);
    let totalSpent = toBigInt(0);

    // Collect all transaction hashes
    const transactionHashes = logs.map((log) => log.transactionHash);

    // Fetch all transactions in parallel
    const transactions = await Promise.all(
      transactionHashes.map((hash) => provider.getTransaction(hash))
    );

    for (const tx of transactions) {
      if (tx.to === contractAddress) {
        totalSpent += toBigInt(tx.value);
      }
    }

    return totalSpent; // return totalSpent in Wei
  } catch (error) {
    logWithTimestamp(`Error fetching total spent: ${error}`, chalk.red);
    return 0;
  }
}

export async function getTotalSpentForContracts(contractAddresses) {
  try {
    const filter = {
      fromBlock: 22119142,
      toBlock: "latest",
      topics: [
        id("Transfer(address,address,uint256)"),
        null,
        zeroPadValue(wallet.address, 32),
      ],
    };

    const logs = await provider.getLogs(filter);

    // Initialize totalSpentMap with zero for each address
    const totalSpentMap = {};
    for (const address of contractAddresses) {
      totalSpentMap[address] = toBigInt(0);
    }

    // Collect all unique transaction hashes
    const transactionHashes = [
      ...new Set(logs.map((log) => log.transactionHash)),
    ];

    // Fetch all transactions in parallel
    const transactions = await Promise.all(
      transactionHashes.map((hash) => provider.getTransaction(hash))
    );

    for (const tx of transactions) {
      if (contractAddresses.includes(tx.to)) {
        totalSpentMap[tx.to] += toBigInt(tx.value);
      }
    }

    return totalSpentMap;
  } catch (error) {
    logWithTimestamp(`Error fetching total spent: ${error}`, chalk.red);
    return {};
  }
}

export async function getBalanceAndSellAll(contract) {
  try {
    const balance = await contract.balanceOf(wallet.address);
    logWithTimestamp(`Balance of tokens: ${balance.toString()}`, chalk.blue);

    if (balance > 0) {
      logWithTimestamp(`Selling all tokens`, chalk.green);
      // await executeSell(contract, balance);
    } else {
      logWithTimestamp(`No tokens to sell`, chalk.yellow);
    }
  } catch (error) {
    logWithTimestamp(`Error fetching balance: ${error}`, chalk.red);
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