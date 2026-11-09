import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Baca contracts/.env (tidak di-commit). Isinya SEPOLIA_RPC_URL dan OPERATOR_PRIVATE_KEY.
dotenv.config();

const { SEPOLIA_RPC_URL, OPERATOR_PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL ?? "",
      accounts: OPERATOR_PRIVATE_KEY ? [OPERATOR_PRIVATE_KEY] : [],
    },
  },
};

export default config;
