import { deployments, ethers, network } from "hardhat";
import { developmentChain } from "../hardhat.helper";
import { AstroNFT } from "../typechain-types";

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("Astro Test", () => {
          let Astro: AstroNFT;

          beforeEach(async () => {
              await deployments.fixture(["all"]);
              Astro = await ethers.getContract("AstroNFT");
          });
          it("should first", async () => {
              Astro.bur;
          });
      });
