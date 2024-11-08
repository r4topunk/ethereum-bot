# Blockchain Bot Listener

This project is a blockchain bot listener that detects transactions to a specific contract address and processes them based on certain conditions. The bot uses the ethers.js library to interact with the Ethereum blockchain and monitors the creation of new tokens in a contract.

## Setup

1. Clone the repository:
```sh
git clone https://github.com/r4topunk/ethereum-bot.git
cd ethereum-bot
```

2. Install dependencies:
```sh
npm install
```

3. Create a `.env` file based on the `.env.example` file and fill in your Alchemy API key and wallet private key:
```sh
cp .env.example .env
```

4. Run the bot:
```sh
npm start
```

## Environment Variables

- `ALCHEMY_API_KEY`: Your Alchemy API key.
- `WALLET_PRIVATE_KEY`: Your wallet private key.

## License

This project is licensed under the MIT License.
