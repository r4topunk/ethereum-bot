import dotenv from 'dotenv';
import { logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from 'chalk';
import { formatEther, formatUnits, id, toBigInt, zeroPadValue } from 'ethers';
import { provider } from './provider.js';
import terminalLink from 'terminal-link';

dotenv.config();

export async function executeBuy(contract, valueToBuy) {
  try {
    const txParams = {
      value: valueToBuy
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
    logWithTimestamp(`Transaction confirmed in block: ${receipt.blockNumber}`, chalk.green);
    logWithTimestamp(`Gas used: ${receipt.gasUsed.toString()}`, chalk.green);
  } catch (error) {
    logWithTimestamp(`Error sending transaction: ${error}`, chalk.red);
  }
}

export async function executeSell(contract, tokensToSell) {
  try {
    const txResponse = await contract.sell(
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
    logWithTimestamp(`Transaction confirmed in block: ${receipt.blockNumber}`, chalk.green);
    logWithTimestamp(`Gas used: ${receipt.gasUsed.toString()}`, chalk.green);
  } catch (error) {
    logWithTimestamp(`Error sending transaction: ${error}`, chalk.red);
  }
}

export async function getTokenWorthInEth(contract) {
  try {
    const tokenName = await contract.name();
    const contractAddress = await contract.getAddress();
    
    const link = terminalLink(tokenName, `https://basescan.org/address/${contractAddress}`);

    logWithTimestamp(link, chalk.blue, false);

    logWithTimestamp(`Address: ${contractAddress}`, chalk.blue, false);

    const balance = await contract.balanceOf(wallet.address);
    logWithTimestamp(`Balance: ${formatUnits(balance, 18)}`, chalk.blue, false);
    
    // const totalSpent = await getTotalSpent(contract);
    // logWithTimestamp(`Total spent: ${totalSpent} ETH`, chalk.blue, false);

    if (balance > 0) {
      const ethWorthInWei = await contract.getTokenSellQuote(balance);
      const ethWorth = formatEther(ethWorthInWei);
      const ethWorthStr = ethWorth.toString();

      // Numbers of zero before the first number gt 0
      // Ex: 0.000053561270257356 => 5
      // Ex: 0.000000001068005394 => 9
      let numOfZeros = ethWorthStr.match(/(?<=\.)0+/)[0].length;
      numOfZeros += ethWorth > 0 ? 1 : 0;

      logWithTimestamp(`Worth: [0x${numOfZeros}]${ethWorth}`, chalk.green, false);
      return ethWorth;
    } else {
      logWithTimestamp(`No tokens to calculate worth`, chalk.yellow, false);
      return 0;
    }
  } catch (error) {
    logWithTimestamp(`Error calculating token worth: ${error}`, chalk.red, false);
    return 0;
  }
}

export async function getTotalSpent(contract) {
  try {
    const filter = {
      fromBlock: 22128949,
      toBlock: "latest",
      // address: contract.address,
      topics: [
        id("Transfer(address,address,uint256)"),
        null,
        zeroPadValue(wallet.address, 32)
      ]
    };

    const logs = await provider.getLogs(filter);
    let totalSpent = toBigInt(0);

    for (const log of logs) {
      const tx = await provider.getTransaction(log.transactionHash);
      // if (tx.to === contract.address) {
        totalSpent += toBigInt(tx.value);
      // }
    }

    return formatEther(totalSpent);
  } catch (error) {
    logWithTimestamp(`Error fetching total spent: ${error}`, chalk.red);
    return 0;
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
