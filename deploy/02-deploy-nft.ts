import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../hardhat.helper";
import { verify } from "../utils/verify";

const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const nftDeploy = async (hre: HardhatRuntimeEnvironment) => {
    const {
        getNamedAccounts,
        deployments: { deploy, log },
    } = hre;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    const waitConfirmations = chainId ? networkConfig[chainId].waitConfirmations : 1;
    let args: any[] = [];

    const nft = await deploy("Nft", {
        from: deployer,
        args,
        log: true,
        waitConfirmations,
    });
    if (!developmentChain.includes(network.name) && etherscanApiKey) {
        await verify(nft.address, args);
    }
};

export default nftDeploy;

nftDeploy.tags = ["all", "nft"];
