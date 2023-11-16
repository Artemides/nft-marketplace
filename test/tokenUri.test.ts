import { deployments, network } from "hardhat";
import { developmentChain } from "../hardhat.helper";
import { AstroNFT } from "../typechain-types";

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("ERC721 URI", () => {
          let Astro: AstroNFT;
          beforeEach(async () => {
              await deployments.fixture(["all"]);
          });
      });
