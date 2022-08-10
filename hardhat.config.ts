import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  networks: {
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/9x-YOMw0GSxLYrLM0nrhXISZrGyXLsls",
      accounts: ["66be86b4161644b944d91134ee511f1f5217a1600d4ec37e8dcb0d29b152f3f6"],
    }
  },
  solidity: "0.8.9",
};

export default config;
