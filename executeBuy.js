import dotenv from 'dotenv';
import { logWithTimestamp } from "./utils.js";
import { wallet } from "./wallet.js";
import chalk from 'chalk';

dotenv.config();

export async function executeBuy(contract, valueToBuy) {
  if (typeof contract.buy === 'function') {
    try {
      const txParams = {
        value: valueToBuy
      };

      const txResponse = await contract.buy(
        wallet.address, // recipient
        wallet.address, // refundRecipient
        wallet.address, // orderReferrer
        "r4to rules", // comment
        0, // expectedMarketType
        valueToBuy, // minOrderSize
        0, // sqrtPriceLimitX96
        txParams
      );
      logWithTimestamp(`Transaction sent: ${txResponse.hash}`, chalk.green);

      const receipt = await txResponse.wait();
      logWithTimestamp(`Transaction confirmed in block: ${receipt.blockNumber}`, chalk.green);
    } catch (error) {
      logWithTimestamp(`Error sending transaction: ${error}`, chalk.red);
    }
  } else {
    logWithTimestamp(`Error: 'buy' method not found on contract`, chalk.red);
  }
}
