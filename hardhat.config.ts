import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "solidity-coverage";
import "dotenv/config";
import "./tasks/export-typechain";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
    solidity: "0.8.18",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
            37337: 0,
        },
        buyer: {
            default: 1,
            1: 1,
            37337: 1,
        },
    },
    etherscan: {
        apiKey: etherscanApiKey,
    },
};

export default config;
