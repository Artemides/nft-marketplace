import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../hardhat.helper";
import { network } from "hardhat";
import { verify } from "../utils/verify";

const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const marketplaceDeploy = async (hre: HardhatRuntimeEnvironment) => {
    const {
        getNamedAccounts,
        deployments: { log, deploy },
    } = hre;
    const chainId = network.config.chainId ?? "";
    let waitConfirmations = chainId ? networkConfig[chainId].waitConfirmations : 1;

    const { deployer } = await getNamedAccounts();
    let args: any[] = [];
    log("Deploying Marketplace...");
    const marketplace = await deploy("Marketplace", {
        from: deployer,
        args,
        log: true,
        waitConfirmations,
    });
    if (!developmentChain.includes(network.name) && etherscanApiKey) {
        await verify(marketplace.address, args);
    }
};

export default marketplaceDeploy;

marketplaceDeploy.tags = ["all", "marketplace"];
