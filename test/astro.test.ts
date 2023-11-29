import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChain } from "../hardhat.helper";
import { AstroNFT } from "../typechain-types";
import { EventLog, Signer } from "ethers";
import { assert, expect } from "chai";

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("Astro NFT", () => {
      const TOKEN_URI = "ipfs://pinata.gateway/";
      let deployerSigner: Signer;
      let buyerSigner: Signer;
      let Astro: AstroNFT;

      beforeEach(async () => {
        const { deployer, buyer } = await getNamedAccounts();
        deployerSigner = await ethers.getSigner(deployer);
        buyerSigner = await ethers.getSigner(buyer);
        await deployments.fixture(["all"]);
        Astro = await ethers.getContract("AstroNFT", deployer);
      });

      it("mints an nft and sets its token URI", async () => {
        const mint = Astro.mint(TOKEN_URI);
        await expect(mint)
          .to.emit(Astro, "MetadataUpdate")
          .and.emit(Astro, "Transfer");
      });

      describe("Once a NFT gets minted", () => {
        const newURI = "ipfs://pinata.gateway/new";
        let tokenId: bigint;

        beforeEach(async () => {
          const tx = await Astro.mint(TOKEN_URI);
          const txReceipt = await tx.wait(1);
          const logs = txReceipt?.logs as EventLog[];
          const event = logs.find(
            (log) => log.eventName === Astro.getEvent("Transfer").name,
          );
          tokenId = event?.args!.tokenId || -1;
        });

        it("should return the set token URI", async () => {
          const tokenURI = await Astro.tokenURI(tokenId);
          assert.equal(TOKEN_URI, tokenURI);
        });

        it("should let update nft URI only to Token Owner", async () => {
          const tx = Astro.connect(buyerSigner).updateTokenURI(tokenId, newURI);
          await expect(tx).to.be.revertedWithCustomError(
            Astro,
            "Astro__OnlyOwner",
          );
        });

        it("should let update nft URI", async () => {
          const updateTokenUri = Astro.updateTokenURI(tokenId, newURI);
          await expect(updateTokenUri).to.emit(
            Astro,
            Astro.getEvent("MetadataUpdate").name,
          );
        });

        describe("Burn Token", () => {
          it("reverts an attempt of burning a non existing token", async () => {
            const tx = Astro.connect(buyerSigner).burn(tokenId + BigInt(1));
            await expect(tx).to.revertedWithCustomError(
              Astro,
              "ERC721NonexistentToken",
            );
          });

          it("should allow only the owner to burn the token", async () => {
            const tx = Astro.connect(buyerSigner).burn(tokenId);
            await expect(tx).to.revertedWithCustomError(
              Astro,
              "ERC721InsufficientApproval",
            );
          });

          it("should burn the token and remove its URI", async () => {
            const tx = Astro.burn(tokenId);
            const deployerAddress = await deployerSigner.getAddress();
            await expect(tx)
              .to.emit(Astro, Astro.getEvent("Transfer").name)
              .withArgs(deployerAddress, ethers.ZeroAddress, tokenId);

            const balance = await Astro.balanceOf(deployerSigner);
            assert.equal(balance, BigInt(0));
          });

          it("reverts retrieving a burned tokenURI", async () => {
            await Astro.burn(tokenId);
            await expect(Astro.tokenURI(tokenId)).to.be.revertedWithCustomError(
              Astro,
              `ERC721NonexistentToken`,
            );
          });
        });
      });
    });
