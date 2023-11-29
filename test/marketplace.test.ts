import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChain } from "../hardhat.helper";
import { Marketplace, Nft } from "../typechain-types";
import { assert, expect } from "chai";
import { ContractRunner, parseEther } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("Marketplace", () => {
      let deployer: HardhatEthersSigner;
      let buyer: HardhatEthersSigner;
      let marketplace: Marketplace;
      let marketplaceAddress: string;
      let nft: Nft;
      let nftAddress: string;
      const NFT_PRICE = ethers.parseEther("0.01");
      beforeEach(async () => {
        const [_deployer, _buyer] = await ethers.getSigners();
        deployer = _deployer;
        buyer = _buyer;
        await deployments.fixture(["all"]);
        marketplace = await ethers.getContract("NFTMarket");
        marketplaceAddress = await marketplace.getAddress();
        nft = await ethers.getContract("Nft", deployer);
        nftAddress = await nft.getAddress();
      });

      describe("Listing a NFT", () => {
        let tokenId: bigint;
        beforeEach(async () => {
          await nft.mint();
          tokenId = await nft.getTokenCounter();
        });

        it("Reverts if the deployer is not the owner ", async () => {
          await expect(
            marketplace.connect(buyer).listNft(nftAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(
            marketplace,
            "Marketplace__NotNftOwner",
          );
        });

        it("Reverts if the Marketpalce is not authorized to handle this NFT", async () => {
          await expect(
            marketplace.listNft(nftAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(
            marketplace,
            "Marketplace__NftUnAuthorized",
          );
        });

        it("Reverts if the nft has been already listed", async () => {
          await nft.approve(marketplaceAddress, tokenId);
          await marketplace.listNft(nftAddress, tokenId, NFT_PRICE);
          await expect(
            marketplace.listNft(nftAddress, tokenId, NFT_PRICE),
          ).to.be.revertedWithCustomError(
            marketplace,
            "Marketplace__NftAlreadyListed",
          );
        });

        it("Won't list NFTs with zero price", async () => {
          await nft.approve(marketplaceAddress, tokenId);
          await expect(
            marketplace.listNft(nftAddress, tokenId, 0),
          ).to.be.revertedWithCustomError(
            marketplace,
            "Marketplace__PriceMustBeAboveZero",
          );
        });

        it("List correctly the NFT on the Marketplace", async () => {
          await nft.approve(marketplaceAddress, tokenId);
          await expect(
            marketplace.listNft(nftAddress, tokenId, NFT_PRICE),
          ).to.emit(marketplace, "NFTListenOn");
        });

        it("List the NFT with the correct Price", async () => {
          await nft.approve(marketplaceAddress, tokenId);
          await expect(marketplace.listNft(nftAddress, tokenId, NFT_PRICE))
            .to.emit(marketplace, "NftListedOn")
            .withArgs(nftAddress, tokenId, NFT_PRICE);
        });
        describe("buy NFT ", () => {
          beforeEach(async () => {
            await nft.approve(marketplaceAddress, tokenId);
            await marketplace.listNft(nftAddress, tokenId, NFT_PRICE);
          });

          it("Reverts if the buying NFT is not listed on the marketplace", async () => {
            await nft.mint();
            const lastTokenId = await nft.getTokenCounter();
            await expect(
              marketplace.buyNft(nftAddress, lastTokenId),
            ).to.be.revertedWithCustomError(
              marketplace,
              "Marketplace__NftUnlisted",
            );
          });

          it("Does not allow to buy your own NFT", async () => {
            await expect(
              marketplace.buyNft(nftAddress, tokenId),
            ).to.be.revertedWithCustomError(
              marketplace,
              "Marketplace__SelfNftPurchaseNotAllowed",
            );
          });

          it("Cancels the purchase if the purchase price is not enough", async () => {
            const purchasePrice = parseEther("0");
            await expect(
              marketplace
                .connect(buyer)
                .buyNft(nftAddress, tokenId, { value: purchasePrice }),
            ).to.be.revertedWithCustomError(
              marketplace,
              "Marketplace__UnsufficientPrice",
            );
          });

          it("Increments the owner sales, unlists and changes of ownership", async () => {
            const [nftPrice, owner] = await marketplace.getNft(
              nftAddress,
              tokenId,
            );
            const initialOwnerSales = await marketplace.balanceOf(owner);
            await marketplace
              .connect(buyer)
              .buyNft(nftAddress, 1, { value: nftPrice });
            const finalOwnerSales = await marketplace.balanceOf(owner);

            const newOwner = await nft.ownerOf(tokenId);
            assert.equal(finalOwnerSales, initialOwnerSales + nftPrice);
            expect(await marketplace.getNft(nftAddress, tokenId)).to.include(
              ethers.ZeroAddress,
            );
            assert.equal(newOwner, buyer.address);
          });

          describe("Unlisting from Marketplace", () => {
            it("Reverts if the token is not listed", async () => {
              await nft.mint();
              const lastTokenId = await nft.getTokenCounter();
              await expect(
                marketplace.unlistNft(nftAddress, lastTokenId),
              ).to.be.revertedWithCustomError(
                marketplace,
                "Marketplace__NftUnlisted",
              );
            });

            it("Reverts if the action intended by another user", async () => {
              await expect(
                marketplace.connect(buyer).unlistNft(nftAddress, tokenId),
              ).to.be.revertedWithCustomError(
                marketplace,
                "Marketplace__NotNftOwner",
              );
            });

            it("Unlists successfully if performed by the owner over a listed NFT", async () => {
              await expect(marketplace.unlistNft(nftAddress, tokenId)).to.emit(
                marketplace,
                "NftUnlisted",
              );
              expect(await marketplace.getNft(nftAddress, tokenId)).to.include(
                ethers.ZeroAddress,
              );
            });
          });

          describe("Update listed NFT on Marketplace", () => {
            const NEW_PRICE = ethers.parseEther("0.1");

            it("Reverts if the token is not listed", async () => {
              await nft.mint();
              const lastTokenId = await nft.getTokenCounter();
              await expect(
                marketplace.updateNftPrice(nftAddress, lastTokenId, NEW_PRICE),
              ).to.be.revertedWithCustomError(
                marketplace,
                "Marketplace__NftUnlisted",
              );
            });

            it("Reverts if the action intended by another user", async () => {
              await expect(
                marketplace
                  .connect(buyer)
                  .updateNftPrice(nftAddress, tokenId, NEW_PRICE),
              ).to.be.revertedWithCustomError(
                marketplace,
                "Marketplace__NotNftOwner",
              );
            });

            it("Updates correctly the NFT listed price", async () => {
              await expect(
                marketplace.updateNftPrice(nftAddress, tokenId, NEW_PRICE),
              ).to.emit(marketplace, "NftPriceUpdated");

              const [newPrice] = await marketplace.getNft(nftAddress, tokenId);
              assert.equal(newPrice, NEW_PRICE);
            });
          });
        });
      });
      describe("Withdraw Sales", () => {
        it("Revers if there is no funds to withdraw", async () => {
          await expect(
            marketplace.withdrawBalance(),
          ).to.be.revertedWithCustomError(
            marketplace,
            "Marketplace__UnsufficientFunds",
          );
        });
        it("Withdraws, restarts the sales to 0 and transfers the money to owner address", async () => {
          const NFT_PRICE = ethers.parseEther("0.01");

          await nft.mint();
          const tokenId = await nft.getTokenCounter();
          await nft.approve(marketplace, tokenId);

          await marketplace.listNft(nftAddress, tokenId, NFT_PRICE);

          await marketplace
            .connect(buyer)
            .buyNft(nftAddress, tokenId, { value: NFT_PRICE });

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
