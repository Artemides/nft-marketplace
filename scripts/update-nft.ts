import { ethers, getNamedAccounts } from "hardhat";
import { NFTMarket, Nft } from "../typechain-types";
import { ContractTransactionReceipt, EventLog } from "ethers";
import { findEvent } from "./mint-list-nft";

const updateNft = async () => {
    const NEW_PRICE = ethers.parseEther("0.02");
    const { deployer } = await getNamedAccounts();
    const NFTMarket: NFTMarket = await ethers.getContract("NFTMarket");
    const NFT: Nft = await ethers.getContract("Nft", deployer);
    const NFTAdds = await NFT.getAddress();
    const lastTokenId = await NFT.getTokenCounter();
    if (lastTokenId === ethers.toBigInt(0)) {
        console.log("token id not minted");
        return;
    }

    const tx = await NFTMarket.updateNftPrice(NFTAdds, lastTokenId, NEW_PRICE);
    const txReceipt = (await tx.wait(1)) as ContractTransactionReceipt;
    const logs = txReceipt.logs as EventLog[];
    const updatedNftEvent = findEvent(logs, "NFTPriceUpdated");
    const { oldPrice, newPrice } = updatedNftEvent?.args ?? { oldPrice: 0, newPrice: 0 };
    console.log({ oldPrice, newPrice });
    const oldPriceEth = ethers.parseUnits(oldPrice, "ether");
    const newPriceEth = ethers.parseUnits(newPrice, "ether");
    console.log(
        `$ NFT from collectioon ${NFTAdds} tokenId ${lastTokenId} with Price ${oldPriceEth}ETH updated to ${newPriceEth}ETH`
    );
};

updateNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
