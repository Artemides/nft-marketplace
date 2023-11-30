import { ContractTransactionResponse, EventLog } from "ethers";
import { AstroNFT } from "../typechain-types";

export const mintAstroTokens = async (Astro: AstroNFT, tokens: number) => {
  const defaultTokenURI = "ipfs://pinata.gateway/";
  const mintTokens: Promise<bigint[]> = new Promise(async (resolve, reject) => {
    try {
      const tokenIds: bigint[] = [];

      while (tokens > 0) {
        const tx = await Astro.mint(defaultTokenURI);
        const receipt = await tx.wait(1);
        const logs = receipt?.logs as EventLog[];
        const event = logs.find(
          (log) => log.eventName == Astro.getEvent("Transfer").name,
        )!;

        const [, , tokenId] = event.args;
        tokenIds.push(tokenId);
        tokens--;
      }
      resolve(tokenIds);
    } catch (error) {
      reject(error);
    }
  });

  return await mintTokens;
};
