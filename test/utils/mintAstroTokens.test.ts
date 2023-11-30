import { deployments, ethers } from "hardhat";
import { AstroNFT } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { mintAstroTokens } from "../../utils/mintNft";
import { assert } from "chai";

describe("mint Astro tokens", () => {
  let Astro: AstroNFT;
  let deployer: HardhatEthersSigner;
  before(async () => {
    [deployer] = await ethers.getSigners();
    await deployments.fixture(["astro"]);
    Astro = await ethers.getContract("AstroNFT", deployer);
  });

  it("should mint 1 nfts and return 1 token ids", async () => {
    const ids = await mintAstroTokens(Astro, 1);
    assert.lengthOf(ids, 1);
  });
  it("should mint 2 nfts and return 2 token ids", async () => {
    const ids = await mintAstroTokens(Astro, 2);
    assert.lengthOf(ids, 2);
  });
  it("should mint 10 nfts and return 10 token ids", async () => {
    const ids = await mintAstroTokens(Astro, 10);
    assert.lengthOf(ids, 10);
  });
});
