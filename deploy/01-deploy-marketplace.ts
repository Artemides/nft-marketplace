import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../hardhat.helper";
import { network } from "hardhat";
import { verify } from "../utils/verify";

const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const nftMarketDeploy = async (hre: HardhatRuntimeEnvironment) => {
    const {
        getNamedAccounts,
        deployments: { log, deploy },
    } = hre;
    const chainId = network.config.chainId ?? "";
    let waitConfirmations = chainId ? networkConfig[chainId].waitConfirmations : 1;

    const { deployer } = await getNamedAccounts();
    let args: any[] = [];
    log("Deploying NFTMarket...");
    const nftMarket = await deploy("NFTMarket", {
        from: deployer,
        args,
        log: true,
        waitConfirmations,
    });
    if (!developmentChain.includes(network.name) && etherscanApiKey) {
        await verify(nftMarket.address, args);
    }
};

export default nftMarketDeploy;

nftMarketDeploy.tags = ["all", "nftMarket"];
