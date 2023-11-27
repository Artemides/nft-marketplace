import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain } from "../hardhat.helper";
import { network } from "hardhat";
import { verify } from "../utils/verify";

const deployAstro = async (hre: HardhatRuntimeEnvironment) => {
    const {
        getNamedAccounts,
        deployments: { deploy },
    } = hre;
    const astroArgs: any[] = [];
    const { deployer } = await getNamedAccounts();

    const astro = await deploy("AstroNFT", {
        from: deployer,
        args: astroArgs,
        log: true,
        waitConfirmations: 1,
    });

    if (!developmentChain.includes(network.name)) {
        await verify(astro.address, astroArgs);
    }
};
export default deployAstro;

deployAstro.tags = ["all", "astro"];
