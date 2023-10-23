import { ethers } from "hardhat";
import { Marketplace, Nft } from "../typechain-types";
import { ContractTransactionReceipt, EventLog } from "ethers";

async function mintAndListNft() {
    const NFT_PRICE = ethers.parseEther("0.01");

    const marketplace: Marketplace = await ethers.getContract("Marketplace");
    const marketplaceAddress = await marketplace.getAddress();
    const nft: Nft = await ethers.getContract("Nft");
    const nftAddress = await nft.getAddress();

    console.log("Minting NFT");
    const mintTx = await nft.mint();
    const mintTxReceipt = (await mintTx.wait(1)) as ContractTransactionReceipt;
    const logs = mintTxReceipt.logs as EventLog[];
    const transferEvent = findEvent(logs, "Transfer");
    const tokenId = transferEvent?.args.tokenId ?? 0;
    if (!tokenId) return;

    console.log(`NFT ${tokenId} Approving Marketplace ${marketplaceAddress}`);
    await nft.approve(marketplaceAddress, tokenId);

    console.log(`Marketplace listing NFT ${tokenId}`);

    await marketplace.listNft(nftAddress, tokenId, NFT_PRICE);
}

function findEvent(logs: EventLog[], eventName: string) {
    const event = logs.find((log) => log.eventName === eventName);

    return event;
}

mintAndListNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
