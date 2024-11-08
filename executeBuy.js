import dotenv from 'dotenv';
import { logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from 'chalk';
import { formatEther, formatUnits, toBigInt } from 'ethers';

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
    const balance = await contract.balanceOf(wallet.address);
    logWithTimestamp(`Balance of tokens: ${formatUnits(balance, 18)}`, chalk.blue);

    if (balance > 0) {
      const ethWorthInWei = await contract.getTokenSellQuote(balance);
      const ethWorth = formatEther(ethWorthInWei);
      logWithTimestamp(`Worth of all tokens in ETH: ${ethWorth}`, chalk.green);
      return ethWorth;
    } else {
      logWithTimestamp(`No tokens to calculate worth`, chalk.yellow);
      return 0;
    }
  } catch (error) {
    logWithTimestamp(`Error calculating token worth: ${error}`, chalk.red);
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
