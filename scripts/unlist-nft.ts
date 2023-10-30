import { ethers, getNamedAccounts } from "hardhat";
import { NFTMarket, Nft } from "../typechain-types";
import { ContractTransactionReceipt, EventLog } from "ethers";
import { findEvent } from "./mint-list-nft";

const unlistNft = async () => {
    const { deployer } = await getNamedAccounts();
    const NFTMarket: NFTMarket = await ethers.getContract("NFTMarket");
    const NFT: Nft = await ethers.getContract("Nft", deployer);
    const NFTAdds = await NFT.getAddress();
    const lastTokenId = await NFT.getTokenCounter();
    const tokenOwner = await NFT.ownerOf(lastTokenId);
    if (tokenOwner !== deployer) {
        console.log("cannot unlist an NFT you do not own");
        return;
    }

    console.log(`unlistings from collection: ${NFTAdds}}, nft: ${lastTokenId}`);
    const unlistTx = await NFTMarket.unlistNft(NFTAdds, lastTokenId);
    const txReceipt = (await unlistTx.wait(1)) as ContractTransactionReceipt;
    const logs = txReceipt.logs as EventLog[];
    const unlistEvent = findEvent(logs, "NFTUnlisted");
    const unlistedNftAddress = unlistEvent?.args.nftAddress ?? "";
    const unlistedTokenId = unlistEvent?.args.tokenId ?? 0;
    if (NFTAdds !== unlistedNftAddress || lastTokenId !== unlistedTokenId) {
        console.log(`Unlisting from collection ${NFTAdds} tokenId ${lastTokenId} FAILED`);
    }

    console.log(
        `Unlisting from collection ${unlistedNftAddress} tokenId ${unlistedTokenId} COMPLETED`
    );
};

unlistNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
