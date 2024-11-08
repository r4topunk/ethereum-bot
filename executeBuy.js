import dotenv from "dotenv";
import { getEthZeros, logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import { formatEther, formatUnits, id, toBigInt, zeroPadValue } from "ethers";
import { provider } from "./provider.js";
import terminalLink from "terminal-link";

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
  console.log({ tokensToSell });
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
    console.log({ txResponse });
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
    logWithTimestamp(`Balance ${formatUnits(balance, 18)}`, chalk.black, false);

    const totalSpentWei = totalSpentMap[contractAddress] || toBigInt(0);
    let spentNumOfZeros = getEthZeros(formatEther(totalSpentWei));
    logWithTimestamp(
      `Spent   [0x${spentNumOfZeros}]${formatEther(totalSpentWei)}`,
      chalk.black,
      false
    );

    if (balance > 0) {
      const ethWorthInWei = await contract.getTokenSellQuote(balance);
      const ethWorth = formatEther(ethWorthInWei);
      let numOfZeros = getEthZeros(ethWorth);
      logWithTimestamp(
        `Worth   [0x${numOfZeros}]${ethWorth}`,
        chalk.black,
        false
      );

      const differenceInWei = ethWorthInWei - totalSpentWei;
      // const difference = formatEther(differenceInWei);
      // let diffNumOfZeros = getEthZeros(ethWorth);
      // logWithTimestamp(`Diff    [0x${diffNumOfZeros}]${difference}`, chalk.magenta, false);

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
