import { ethers, getNamedAccounts } from "hardhat";
import { NFTMarket, Nft } from "../typechain-types";
import { ContractTransactionReceipt, EventLog, Result } from "ethers";
import { findEvent } from "./mint-list-nft";

const purchaseNft = async () => {
    const { buyer: buyerAddress } = await getNamedAccounts();
    const buyer = await ethers.getSigner(buyerAddress);
    const NFTMarket: NFTMarket = await ethers.getContract("NFTMarket");
    const NFT: Nft = await ethers.getContract("Nft", buyer);
    const NFTAdds = await NFT.getAddress();
    const lastTokenId = await NFT.getTokenCounter();
    console.log(`purchasing from collection: ${NFTAdds}}, nft: ${lastTokenId}`);

    const { price: nftPrice } = await NFTMarket.getNft(NFTAdds, lastTokenId);
    const unlistTx = await NFTMarket.connect(buyer).purchaseNft(NFTAdds, lastTokenId, {
        value: nftPrice,
    });

    const txReceipt = (await unlistTx.wait(1)) as ContractTransactionReceipt;
    const logs = txReceipt.logs as EventLog[];
    const unlistEvent = findEvent(logs, "NFTPurchased");
    const eventArgs = unlistEvent?.args;
    if (!eventArgs) return;

    const { nftAddress, tokenId, price } = eventArgs;
    console.log(`Purchased by ${buyer} from collection ${nftAddress} tokenId ${tokenId} COMPLETED`);
};

purchaseNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
