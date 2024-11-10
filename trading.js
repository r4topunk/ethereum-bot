
import { logColor } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from "chalk";
import { provider } from "./provider.js";
import { id, zeroPadValue, toBigInt } from "ethers";

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
    logColor(`Transaction sent: ${txResponse.hash}`, chalk.green);

    const receipt = await txResponse.wait();
    logColor(
      `Transaction confirmed in block: ${receipt.blockNumber}`,
      chalk.green
    );
    logColor(
      `Gas paid: ${receipt.gasUsed * receipt.gasPrice}`,
      chalk.green
    );
  } catch (error) {
    logColor(`Error sending transaction: ${error}`, chalk.red);
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
    logColor(`Transaction sent: ${txResponse.hash}`, chalk.green);

    const receipt = await txResponse.wait();
    logColor(
      `Transaction confirmed in block: ${receipt.blockNumber}`,
      chalk.green
    );
    logColor(
      `Gas paid: ${receipt.gasUsed * receipt.gasPrice}`,
      chalk.green
    );
  } catch (error) {
    logColor(`Error sending transaction: ${error}`, chalk.red);
  }
}

export async function getBalanceAndSellAll(contract) {
  try {
    const balance = await contract.balanceOf(wallet.address);
    logColor(`Balance of tokens: ${balance.toString()}`, chalk.blue);

    if (balance > 0) {
      logColor(`Selling all tokens`, chalk.green);
      // await executeSell(contract, balance);
    } else {
      logColor(`No tokens to sell`, chalk.yellow);
    }
  } catch (error) {
    logColor(`Error fetching balance: ${error}`, chalk.red);
  }
}