import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChain } from "../hardhat.helper";
import { AstroNFT, NFTMarket } from "../typechain-types";
import { assert, expect } from "chai";
import { parseEther } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { mintAstroTokens } from "../utils/mintNft";

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("NFTMarket", () => {
      const TOKEN_URI = "ipfs://pinata.gatewat/";
      let deployer: HardhatEthersSigner;
      let buyer: HardhatEthersSigner;
      let marketplace: NFTMarket;
      let marketplaceAddress: string;
      let Astro: AstroNFT;
      let astroAddress: string;
      const NFT_PRICE = ethers.parseEther("0.01");
      beforeEach(async () => {
        [deployer, buyer] = await ethers.getSigners();

        await deployments.fixture(["all"]);
        marketplace = await ethers.getContract("NFTMarket");
        marketplaceAddress = await marketplace.getAddress();
        Astro = await ethers.getContract("AstroNFT", deployer);
        astroAddress = await Astro.getAddress();
      });

      describe("Listing a NFT", () => {
        let tokenId: bigint;
        let otherTokenId: bigint;
        beforeEach(async () => {
          [tokenId, otherTokenId] = await mintAstroTokens(Astro, 2);
        });

        it("Reverts if the deployer is not the owner ", async () => {
          await expect(
            marketplace
              .connect(buyer)
              .listNft(astroAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(marketplace, "NFTMarket__NoNftOwner");
        });

        it("Reverts if the Marketpalce is not authorized to handle this NFT", async () => {
          await expect(
            marketplace.listNft(astroAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(
            marketplace,
            "NFTMarket__NftUnauthorized",
          );
        });

        it("Reverts if any Astro NFT has been already listed", async () => {
          await Astro.approve(marketplaceAddress, tokenId);
          await marketplace.listNft(astroAddress, tokenId, NFT_PRICE);
          await expect(
            marketplace.listNft(astroAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(
            marketplace,
            "NFTMarket__NftAlreadyListed",
          );
        });

        it("Won't list NFTs with zero price", async () => {
          await Astro.approve(marketplaceAddress, tokenId);
          await expect(
            marketplace.listNft(astroAddress, tokenId, 0),
          ).to.be.revertedWithCustomError(
            marketplace,
            "NFTMarket__PriceMustBeAboveZero",
          );
        });

        it("List correctly the NFT on the Marketplace", async () => {
          await Astro.approve(marketplaceAddress, tokenId);
          await expect(
            marketplace.listNft(astroAddress, tokenId, NFT_PRICE),
          ).to.emit(marketplace, "NFTListenOn");
        });

        it("List the NFT with the correct Price", async () => {
          await Astro.approve(marketplaceAddress, tokenId);
          await expect(marketplace.listNft(astroAddress, tokenId, NFT_PRICE))
            .to.emit(marketplace, "NFTListenOn")
            .withArgs(astroAddress, tokenId, NFT_PRICE);
        });

        describe("buy NFT ", () => {
          beforeEach(async () => {
            await Astro.approve(marketplaceAddress, tokenId);
            await marketplace.listNft(astroAddress, tokenId, NFT_PRICE);
          });

          it("Reverts if the buying NFT is not listed on the marketplace", async () => {
            await expect(
              marketplace.purchaseNft(astroAddress, tokenId + BigInt(1)),
            ).to.be.revertedWithCustomError(marketplace, "NFTMarket__Unlisted");
          });

          it("Does not allow to buy your own NFT", async () => {
            await expect(
              marketplace.purchaseNft(astroAddress, tokenId),
            ).to.be.revertedWithCustomError(
              marketplace,
              "NFTMarket__SelfPurchase",
            );
          });

          it("Cancels the purchase if not enought funds to buy", async () => {
            const purchasePrice = parseEther("0");
            await expect(
              marketplace
                .connect(buyer)
                .purchaseNft(astroAddress, tokenId, { value: purchasePrice }),
            ).to.be.revertedWithCustomError(
              marketplace,
              "NFTMarket__InsufficientPrice",
            );
          });

          it("Increments the owner sales, unlists and changes of ownership", async () => {
            const [nftPrice, owner] = await marketplace.getNft(
              astroAddress,
              tokenId,
            );
            const initialOwnerSales = await marketplace.balanceOf(owner);
            await marketplace
              .connect(buyer)
              .purchaseNft(astroAddress, 1, { value: nftPrice });
            const finalOwnerSales = await marketplace.balanceOf(owner);

            const newOwner = await Astro.ownerOf(tokenId);
            assert.equal(finalOwnerSales, initialOwnerSales + nftPrice);
            expect(await marketplace.getNft(astroAddress, tokenId)).to.include(
              ethers.ZeroAddress,
            );
            assert.equal(newOwner, buyer.address);
          });

          describe("Unlisting from Marketplace", () => {
            it("Reverts if the token is not listed", async () => {
              await expect(
                marketplace.unlistNft(astroAddress, otherTokenId),
              ).to.be.revertedWithCustomError(
                marketplace,
                "NFTMarket__Unlisted",
              );
            });

            it("Reverts if the action intended by another user", async () => {
              await expect(
                marketplace.connect(buyer).unlistNft(astroAddress, tokenId),
              ).to.be.revertedWithCustomError(
                marketplace,
                "NFTMarket__NoNftOwner",
              );
            });

            it("Unlists successfully if performed by the owner over a listed NFT", async () => {
              await expect(
                marketplace.unlistNft(astroAddress, tokenId),
              ).to.emit(marketplace, "NFTUnlisted");
              expect(
                await marketplace.getNft(astroAddress, tokenId),
              ).to.include(ethers.ZeroAddress);
            });
          });

          describe("Update listed NFT on Marketplace", () => {
            const NEW_PRICE = ethers.parseEther("0.1");

            it("Reverts if the token is not listed", async () => {
              await expect(
                marketplace.updateNftPrice(
                  astroAddress,
                  tokenId + BigInt(1),
                  NEW_PRICE,
                ),
              ).to.be.revertedWithCustomError(
                marketplace,
                "NFTMarket__Unlisted",
              );
            });

            it("Reverts if the action intended by another user", async () => {
              await expect(
                marketplace
                  .connect(buyer)
                  .updateNftPrice(astroAddress, tokenId, NEW_PRICE),
              ).to.be.revertedWithCustomError(
                marketplace,
                "NFTMarket__NoNftOwner",
              );
            });

            it("Updates correctly the NFT listed price", async () => {
              await expect(
                marketplace.updateNftPrice(astroAddress, tokenId, NEW_PRICE),
              ).to.emit(marketplace, "NFTPriceUpdated");

              const [newPrice] = await marketplace.getNft(
                astroAddress,
                tokenId,
              );
              assert.equal(newPrice, NEW_PRICE);
            });
          });
        });

        describe("Withdraw Sales", () => {
          it("Revers if there is no funds to withdraw", async () => {
            await expect(
              marketplace.withdrawBalance(),
            ).to.be.revertedWithCustomError(
              marketplace,
              "NFTMarket__InsufficientFunds",
            );
          });

          it("Withdraws, restarts the sales to 0 and transfers the money to owner address", async () => {
            const NFT_PRICE = ethers.parseEther("0.01");

            await Astro.approve(marketplace, tokenId);

            await marketplace.listNft(astroAddress, tokenId, NFT_PRICE);

            await marketplace
              .connect(buyer)
              .purchaseNft(astroAddress, tokenId, { value: NFT_PRICE });

            const initialDeployerBalance = await ethers.provider.getBalance(
              deployer.address,
            );
            const startingSales = await marketplace.balanceOf(deployer);
            const withdrawTx = await marketplace.withdrawBalance();
            const withdrawTxReceipt = await withdrawTx.wait(1);

            let gasCost = BigInt(0);
            if (withdrawTxReceipt) {
              gasCost = withdrawTxReceipt.gasUsed * withdrawTxReceipt.gasPrice;
            }
            const finaLSales = await marketplace.balanceOf(deployer);

            const finalDeployerBalance = await ethers.provider.getBalance(
              deployer.address,
            );

            assert.equal(finaLSales, BigInt(0));
            assert.equal(
              finalDeployerBalance,
              initialDeployerBalance + startingSales - gasCost,
            );
          });
        });
      });
    });
